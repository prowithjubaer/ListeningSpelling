import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [phone, setPhone] = useState(''); const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const handleSubmit = async (e) => { e.preventDefault(); if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; } setLoading(true); try { await register(name, email, password, phone); toast.success('Account created! 🎉'); } catch (err) { toast.error(err.response?.data?.error || 'Registration failed'); } finally { setLoading(false); } };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-500 to-navy-800 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8"><div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4"><span className="text-3xl font-bold text-brand-navy">PE</span></div><h1 className="text-3xl font-bold text-white">Pro English BD</h1><p className="text-navy-200 mt-2">Create your account</p></div>
        <div className="card">
          <h2 className="text-2xl font-bold text-center mb-6 text-brand-navy">Register</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="আপনার নাম" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="input-field" placeholder="01XXXXXXXXX" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Min 6 characters" required /></div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Creating...' : 'Create Account'}</button>
          </form>
          <p className="text-center mt-4 text-sm text-gray-600">Already have an account? <Link to="/login" className="text-brand-navy font-semibold hover:underline">Login</Link></p>
        </div>
      </div>
    </div>
  );
}
