import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        if (decodedToken.exp * 1000 > Date.now()) {
          setUser({ ...decodedToken, id: decodedToken.sub || decodedToken.id });
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
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