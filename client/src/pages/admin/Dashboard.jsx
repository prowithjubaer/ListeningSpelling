import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(() => toast.error('ড্যাশবোর্ড লোড করতে সমস্যা হয়েছে'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
        </div>
      </AdminLayout>
    );
  }

  const stats = data?.stats || {};
  const topStudents = data?.top_students || [];
  const recentActivity = data?.recent_activity || [];
  const categoryOverview = data?.categories || [];

  return (
    <AdminLayout title="📊 Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">👥</div>
            <div>
              <p className="text-2xl font-bold text-brand-navy">{stats.total_students || 0}</p>
              <p className="text-xs text-gray-500">Total Students</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">🎧</div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.total_items || 0}</p>
              <p className="text-xs text-gray-500">Listening Items</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">📝</div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.total_attempts || 0}</p>
              <p className="text-xs text-gray-500">Total Attempts</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">🎯</div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.avg_accuracy || 0}%</p>
              <p className="text-xs text-gray-500">Avg Accuracy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Link to="/admin/items/new" className="card hover:shadow-md transition text-center py-4">
          <span className="text-2xl block mb-1">➕</span>
          <span className="text-sm font-medium text-brand-navy">Add Item</span>
        </Link>
        <Link to="/admin/students" className="card hover:shadow-md transition text-center py-4">
          <span className="text-2xl block mb-1">👥</span>
          <span className="text-sm font-medium text-brand-navy">Students</span>
        </Link>
        <Link to="/admin/import" className="card hover:shadow-md transition text-center py-4">
          <span className="text-2xl block mb-1">📥</span>
          <span className="text-sm font-medium text-brand-navy">Import</span>
        </Link>
        <Link to="/admin/reports" className="card hover:shadow-md transition text-center py-4">
          <span className="text-2xl block mb-1">📈</span>
          <span className="text-sm font-medium text-brand-navy">Reports</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Overview */}
        <div className="card">
          <h3 className="text-lg font-bold text-brand-navy mb-4">📂 Category Overview</h3>
          {categoryOverview.length === 0 ? (
            <p className="text-gray-500 text-sm">কোনো ক্যাটাগরি ডেটা নেই</p>
          ) : (
            <div className="space-y-3">
              {categoryOverview.map(cat => (
                <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-sm">{cat.category}</p>
                    <p className="text-xs text-gray-500">{cat.count || 0} items</p>
                  </div>
                  <span className="text-sm font-semibold text-brand-navy">{cat.accuracy || 0}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Students */}
        <div className="card">
          <h3 className="text-lg font-bold text-brand-navy mb-4">🏆 Top Students</h3>
          {topStudents.length === 0 ? (
            <p className="text-gray-500 text-sm">কোনো স্টুডেন্ট ডেটা নেই</p>
          ) : (
            <div className="space-y-3">
              {topStudents.map((student, idx) => (
                <div key={student.id || idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.accuracy || 0}% accuracy</p>
                  </div>
                  <span className="font-bold text-sm text-brand-navy">{student.xp || 0} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card mt-6">
        <h3 className="text-lg font-bold text-brand-navy mb-4">📋 Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 text-sm">কোনো সাম্প্রতিক কার্যকলাপ নেই</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Student</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Item</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Result</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3">{activity.student_name}</td>
                    <td className="py-2 px-3 truncate max-w-[150px]">{activity.item_text}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        activity.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {activity.correct ? '✅ Correct' : '❌ Wrong'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-400 text-xs">
                      {activity.created_at ? new Date(activity.created_at).toLocaleString('bn-BD') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
