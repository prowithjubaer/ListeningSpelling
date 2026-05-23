import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
const navItems = [{ path: '/admin', label: 'Dashboard', icon: '📊' }, { path: '/admin/items', label: 'Listening Items', icon: '🎧' }, { path: '/admin/students', label: 'Students', icon: '👥' }, { path: '/admin/batches', label: 'Batches', icon: '📦' }, { path: '/admin/assignments', label: 'Assignments', icon: '📋' }, { path: '/admin/import', label: 'Import/Export', icon: '📥' }, { path: '/admin/reports', label: 'Reports', icon: '📈' }, { path: '/admin/settings', label: 'Settings', icon: '⚙️' }];

export default function AdminLayout({ children, title }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-navy text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-full flex items-center justify-center"><span className="text-sm font-bold text-brand-navy">PE</span></div><div><h1 className="font-bold text-lg">Admin Panel</h1><p className="text-navy-200 text-xs">Pro English BD</p></div></div>
          <div className="flex items-center gap-4"><span className="text-sm text-navy-200 hidden sm:inline">{user?.name}</span><button onClick={logout} className="text-sm bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition">Logout</button></div>
        </div>
      </header>
      <div className="flex">
        <aside className="hidden md:flex flex-col w-64 min-h-[calc(100vh-64px)] bg-white border-r border-gray-100 p-4 sticky top-16 overflow-y-auto">
          <nav className="space-y-1">{navItems.map(item => (<Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${location.pathname === item.path ? 'bg-navy-50 text-brand-navy font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}><span>{item.icon}</span><span>{item.label}</span></Link>))}</nav>
        </aside>
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden overflow-x-auto"><div className="flex py-2 px-2 gap-1 min-w-max">{navItems.map(item => (<Link key={item.path} to={item.path} className={`flex flex-col items-center px-3 py-1 rounded-lg text-xs whitespace-nowrap ${location.pathname === item.path ? 'text-brand-navy font-bold' : 'text-gray-500'}`}><span className="text-lg">{item.icon}</span><span>{item.label}</span></Link>))}</div></nav>
        <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6">{title && <h2 className="text-2xl font-bold text-brand-navy mb-6">{title}</h2>}{children}</main>
      </div>
    </div>
  );
}
