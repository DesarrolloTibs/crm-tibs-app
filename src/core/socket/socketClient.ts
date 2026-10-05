import { io, Socket } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { refreshToken } from '../../services/authService';

export interface CreateSocketOptions {
  namespace: string;
  query?: Record<string, string>;
  authCallback?: (cb: (data: object) => void) => void;
  withCredentials?: boolean;
}

/**
 * Resuelve la URL de origen y el socketPath adecuado, respetando
 * el entorno de desarrollo/producción y proxies de subruta (/backend).
 */
export function getSocketConfig() {
  const rawUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3091';
  const socketPath = rawUrl.includes('/backend') ? '/backend/socket.io' : '/socket.io';
  const originUrl = rawUrl.replace(/\/backend\/?$/, '');
  return { originUrl, socketPath };
}

/**
 * Fábrica de clientes Socket.IO estandarizada para toda la aplicación.
 * Garantiza resiliencia de red con:
 * - Transportes híbridos con fallback ('websocket' y 'polling')
 * - Reconexión automática infinita (reconnection: true, attempts: Infinity)
 * - Backoff exponencial controlado (reconnectionDelay: 1000ms a 5000ms)
 * - Autenticación JWT dinámica con renovación proactiva vía refresh_token
 */
export function createAppSocket(options: CreateSocketOptions): Socket {
  const { originUrl, socketPath } = getSocketConfig();
  const ns = options.namespace.startsWith('/') ? options.namespace : `/${options.namespace}`;

  return io(`${originUrl}${ns}`, {
    path: socketPath,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    timeout: 20000,
    query: options.query,
    withCredentials: options.withCredentials ?? true,
    auth: options.authCallback ?? (async (cb: (data: object) => void) => {
      let token = localStorage.getItem('token');
      const refreshTok = localStorage.getItem('refresh_token');

      // Si el access token ya expiró y contamos con refresh_token, renovar antes de conectar
      if (token && refreshTok) {
        try {
          const decoded = jwtDecode<{ exp?: number }>(token);
          if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
            const newToken = await refreshToken();
            if (newToken) {
              token = newToken;
            }
          }
        } catch {
          // Si falla la decodificación, se envía el token tal cual está almacenado
        }
      }

      cb({ token });
    }),
  });
}

/**
 * Desconecta un socket de forma segura evitando la advertencia de React StrictMode
 * ("WebSocket is closed before the connection is established") cuando el componente
 * se desmonta de inmediato en desarrollo mientras el handshake está en vuelo.
 */
export function safeDisconnect(socket: Socket | null | undefined) {
  if (!socket) return;
  socket.removeAllListeners();
  if (socket.connected) {
    socket.disconnect();
  } else {
    const closeWhenSettled = () => {
      try {
        socket.disconnect();
      } catch {
        // Ignorar si ya estaba desconectado
      }
    };
    socket.once('connect', closeWhenSettled);
    socket.once('connect_error', closeWhenSettled);
    setTimeout(() => {
      if (!socket.disconnected) {
        try {
          socket.disconnect();
        } catch {
          // Ignorar
        }
      }
    }, 2000);
  }
}
