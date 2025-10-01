import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

// Define la estructura esperada del payload del token
interface DecodedToken {
  sub: string;
  username: string;
  role: 'admin' | 'executive';
  // ... cualquier otro dato que incluya tu token
  iat: number;
  exp: number;
}

export const useAuth = () => {
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        if (decodedToken.exp * 1000 > Date.now()) {
          setUser(decodedToken);
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        // En caso de error, el token es inválido, así que dejamos el usuario como null
      }
    }
    setLoading(false);
  }, []);

  return { user, isAdmin: user?.role === 'admin', isEjecutivo: user?.role === 'executive', loading };
};