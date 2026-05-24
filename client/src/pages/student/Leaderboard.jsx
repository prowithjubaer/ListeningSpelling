import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import StudentLayout from '../../components/StudentLayout';
import api from '../../utils/api';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = () => {
    setLoading(true);
    // Backend expects: 'weekly', 'monthly', or anything else for all-time
    const params = {};
    if (period === 'weekly' || period === 'monthly') {
      params.period = period;
    }
    // For 'all', don't send period param — backend defaults to all-time

    api.get('/student/leaderboard', { params })
      .then(res => {
        if (res.data && res.data.enabled === false) {
          setEnabled(false);
          setLeaders([]);
        } else if (res.data && res.data.data) {
          setEnabled(true);
          setLeaders(res.data.data);
        } else {
          setLeaders([]);
        }
      })
      .catch(() => toast.error('লিডারবোর্ড লোড করতে সমস্যা হয়েছে'))
      .finally(() => setLoading(false));
  };

  if (!enabled) {
    return (
      <StudentLayout title="🏆 Leaderboard">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-bold text-brand-navy mb-2">লিডারবোর্ড বন্ধ আছে</h3>
          <p className="text-gray-500">এডমিন লিডারবোর্ড বন্ধ করে রেখেছেন।</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="🏆 Leaderboard">
      {/* Period Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'সর্বকালের' },
          { key: 'weekly', label: 'এই সপ্তাহ' },
          { key: 'monthly', label: 'এই মাস' },
        ].map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${period === p.key ? 'bg-brand-navy text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
        </div>
      ) : leaders.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-bold text-brand-navy mb-2">এখনো কেউ নেই!</h3>
          <p className="text-gray-500">প্র্যাকটিস শুরু করো এবং প্রথম হও!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((entry, index) => (
            <div key={index}
              className={`card flex items-center gap-4 transition ${entry.isCurrentUser ? 'ring-2 ring-brand-navy bg-navy-50' : ''} ${index < 3 ? 'shadow-md' : ''}`}>
              {/* Rank */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                index === 1 ? 'bg-gray-100 text-gray-700' :
                index === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-50 text-gray-500'
              }`}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${entry.isCurrentUser ? 'text-brand-navy' : 'text-gray-800'}`}>
                  {entry.name}
                  {entry.isCurrentUser && <span className="text-xs ml-1 bg-brand-navy text-white px-1.5 py-0.5 rounded-full">তুমি</span>}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span>🔥 {entry.streak || 0} days</span>
                  <span>🎯 {entry.accuracy || 0}%</span>
                </div>
              </div>

              {/* XP */}
              <div className="text-right">
                <p className="font-bold text-brand-navy text-lg">{entry.xp || 0}</p>
                <p className="text-xs text-gray-400">XP</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
