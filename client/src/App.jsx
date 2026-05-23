import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/student/Dashboard';
import Practice from './pages/student/Practice';
import MistakeReview from './pages/student/MistakeReview';
import Leaderboard from './pages/student/Leaderboard';
import StudentBadges from './pages/student/Badges';
import AdminDashboard from './pages/admin/Dashboard';
import AdminItems from './pages/admin/Items';
import AdminItemForm from './pages/admin/ItemForm';
import AdminStudents from './pages/admin/Students';
import AdminBatches from './pages/admin/Batches';
import AdminAssignments from './pages/admin/Assignments';
import AdminImport from './pages/admin/Import';
import AdminSettings from './pages/admin/Settings';
import AdminReports from './pages/admin/Reports';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-brand-navy border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-brand-navy border-t-transparent rounded-full animate-spin"></div></div>;
  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3000, style: { borderRadius: '12px', padding: '12px 20px' } }} />
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/practice" element={<ProtectedRoute role="student"><Practice /></ProtectedRoute>} />
        <Route path="/practice/:category" element={<ProtectedRoute role="student"><Practice /></ProtectedRoute>} />
        <Route path="/mistakes" element={<ProtectedRoute role="student"><MistakeReview /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute role="student"><Leaderboard /></ProtectedRoute>} />
        <Route path="/badges" element={<ProtectedRoute role="student"><StudentBadges /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/items" element={<ProtectedRoute role="admin"><AdminItems /></ProtectedRoute>} />
        <Route path="/admin/items/new" element={<ProtectedRoute role="admin"><AdminItemForm /></ProtectedRoute>} />
        <Route path="/admin/items/:id/edit" element={<ProtectedRoute role="admin"><AdminItemForm /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute role="admin"><AdminStudents /></ProtectedRoute>} />
        <Route path="/admin/batches" element={<ProtectedRoute role="admin"><AdminBatches /></ProtectedRoute>} />
        <Route path="/admin/assignments" element={<ProtectedRoute role="admin"><AdminAssignments /></ProtectedRoute>} />
        <Route path="/admin/import" element={<ProtectedRoute role="admin"><AdminImport /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
