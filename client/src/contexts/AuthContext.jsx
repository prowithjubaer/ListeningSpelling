import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) { api.get('/auth/me').then(res => setUser(res.data)).catch(() => { localStorage.removeItem('token'); setToken(null); }).finally(() => setLoading(false)); }
    else { setLoading(false); }
  }, [token]);

  const login = async (email, password) => { const res = await api.post('/auth/login', { email, password }); localStorage.setItem('token', res.data.token); setToken(res.data.token); setUser(res.data.user); return res.data.user; };
  const register = async (name, email, password, phone) => { const res = await api.post('/auth/register', { name, email, password, phone }); localStorage.setItem('token', res.data.token); setToken(res.data.token); setUser(res.data.user); return res.data.user; };
  const logout = () => { localStorage.removeItem('token'); setToken(null); setUser(null); };

  return <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
