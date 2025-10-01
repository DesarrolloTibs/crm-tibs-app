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
      const decodedToken = jwtDecode<DecodedToken>(token);
      console.log('Decoded Token:', decodedToken);
      setUser(decodedToken);
    }
  }, []);

  return { user, isAdmin: user?.role === 'admin', isEjecutivo: user?.role === 'executive' };
};