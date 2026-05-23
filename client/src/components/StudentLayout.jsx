import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
const navItems = [{ path: '/dashboard', label: 'Dashboard', icon: '🏠' }, { path: '/practice', label: 'Practice', icon: '🎧' }, { path: '/mistakes', label: 'Mistakes', icon: '📝' }, { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' }, { path: '/badges', label: 'Badges', icon: '🎖️' }];

export default function StudentLayout({ children, title }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-navy text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center"><span className="text-sm font-bold text-brand-navy">PE</span></div>
            <div className="hidden sm:block"><h1 className="font-bold text-lg">Pro English BD</h1><p className="text-navy-200 text-xs">ঠান্ডা মাথায় ইংলিশ শিখি</p></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-navy-600 px-3 py-1.5 rounded-lg"><span className="text-yellow-400">⚡</span><span className="font-semibold text-sm">{user?.xp || 0} XP</span></div>
            <div className="hidden sm:flex items-center gap-2 bg-navy-600 px-3 py-1.5 rounded-lg"><span>🔥</span><span className="font-semibold text-sm">{user?.streak || 0} day</span></div>
            <button onClick={logout} className="text-sm bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition">Logout</button>
          </div>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 sm:hidden">
        <div className="flex justify-around py-2">{navItems.map(item => (<Link key={item.path} to={item.path} className={`flex flex-col items-center px-2 py-1 rounded-lg text-xs ${location.pathname === item.path ? 'text-brand-navy font-bold' : 'text-gray-500'}`}><span className="text-lg">{item.icon}</span><span>{item.label}</span></Link>))}</div>
      </nav>
      <div className="flex">
        <aside className="hidden sm:flex flex-col w-60 min-h-[calc(100vh-64px)] bg-white border-r border-gray-100 p-4 sticky top-16">
          <nav className="space-y-1">{navItems.map(item => (<Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${location.pathname === item.path ? 'bg-navy-50 text-brand-navy font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}><span>{item.icon}</span><span>{item.label}</span></Link>))}</nav>
          <div className="mt-auto pt-4 border-t border-gray-100"><div className="flex items-center gap-3 px-4 py-2"><div className="w-8 h-8 bg-brand-navy rounded-full flex items-center justify-center text-white text-xs font-bold">{user?.name?.charAt(0) || 'S'}</div><div className="text-sm"><p className="font-medium">{user?.name}</p><p className="text-gray-500 text-xs">Student</p></div></div></div>
        </aside>
        <main className="flex-1 p-4 sm:p-6 pb-24 sm:pb-6 max-w-6xl">{title && <h2 className="text-2xl font-bold text-brand-navy mb-6">{title}</h2>}{children}</main>
      </div>
    </div>
  );
}
