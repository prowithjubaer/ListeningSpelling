import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); try { await login(email, password); toast.success('Welcome back! 🎉'); } catch (err) { toast.error(err.response?.data?.error || 'Login failed'); } finally { setLoading(false); } };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-500 to-navy-800 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8"><div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4"><span className="text-3xl font-bold text-brand-navy">PE</span></div><h1 className="text-3xl font-bold text-white">Pro English BD</h1><p className="text-navy-200 mt-2 text-lg">ঠান্ডা মাথায় ইংলিশ শিখি</p></div>
        <div className="card">
          <h2 className="text-2xl font-bold text-center mb-6 text-brand-navy">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required /></div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Logging in...' : 'Login'}</button>
          </form>
          <p className="text-center mt-4 text-sm text-gray-600">Don't have an account? <Link to="/register" className="text-brand-navy font-semibold hover:underline">Register</Link></p>
        </div>
        <p className="text-center text-navy-300 text-xs mt-6">শুনুন → লিখুন → বলুন → আবার শুনুন</p>
      </div>
    </div>
  );
}
