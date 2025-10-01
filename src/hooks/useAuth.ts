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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        // Si el token ha expirado, no establecemos el usuario
        if (decodedToken.exp * 1000 > Date.now()) {
          setUser(decodedToken);
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
      }
    }
  }, []);

  return { user, isAdmin: user?.role === 'admin', isEjecutivo: user?.role === 'executive' };
};