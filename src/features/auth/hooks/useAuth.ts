import { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { refreshToken, logout as authServiceLogout, authChannel } from '@core/services/authService';

// Define la estructura esperada del payload del token
interface DecodedToken {
  id: string;
  sub: string;
  username: string;
  role: 'superadmin' | 'admin' | 'executive';
  tenant?: string;
  iat: number;
  exp: number;
}

export const useAuth = () => {
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserFromStorage = useCallback(async () => {
    const token = localStorage.getItem('token');
    const refreshTok = localStorage.getItem('refresh_token');

    if (!token && !refreshTok) {
      setUser(null);
      setLoading(false);
      return;
    }

    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        const timeUntilExpiration = decodedToken.exp * 1000 - Date.now();

        // Si el token aún es válido por más de 60 segundos
        if (timeUntilExpiration > 60000) {
          setUser({ ...decodedToken, id: decodedToken.sub || decodedToken.id });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error al decodificar el access_token:', error);
      }
    }

    // Si el token expiró o está a punto de expirar pero hay refresh_token: intentar silent refresh
    if (refreshTok) {
      try {
        const newToken = await refreshToken();
        if (newToken) {
          const newDecoded = jwtDecode<DecodedToken>(newToken);
          setUser({ ...newDecoded, id: newDecoded.sub || newDecoded.id });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Fallo de silent refresh inicial:', err);
      }
    }

    setUser(null);
    setLoading(false);
  }, []);

  // 1. Carga inicial y listeners de sincronización PWA
  useEffect(() => {
    syncUserFromStorage();

    // Sincronización multi-pestaña y multi-instancia de PWA vía BroadcastChannel
    const handleBroadcastMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      if (type === 'LOGOUT') {
        setUser(null);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (type === 'LOGIN' || type === 'TOKEN_REFRESHED') {
        if (payload?.token) {
          try {
            const decoded = jwtDecode<DecodedToken>(payload.token);
            setUser({ ...decoded, id: decoded.sub || decoded.id });
          } catch {
            syncUserFromStorage();
          }
        }
      }
    };

    authChannel?.addEventListener('message', handleBroadcastMessage);

    // 2. Detección de reactivación de PWA (App Resume / cambio de pestaña / desbloqueo de pantalla)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const decoded = jwtDecode<DecodedToken>(token);
            // Si el token expira en menos de 2 minutos, refrescarlo proactivamente en segundo plano
            if (decoded.exp * 1000 - Date.now() < 120000) {
              refreshToken().catch(err => console.warn('Silent refresh en foco falló:', err));
            }
          } catch {
            // Ignorar
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      authChannel?.removeEventListener('message', handleBroadcastMessage);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [syncUserFromStorage]);

  const logout = () => {
    authServiceLogout();
    setUser(null);
  };

  return {
    user,
    logout,
    isSuperAdmin: user?.role === 'superadmin',
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isEjecutivo: user?.role === 'executive',
    loading,
  };
};