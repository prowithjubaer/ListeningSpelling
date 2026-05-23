import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import StudentLayout from '../../components/StudentLayout';
import api from '../../utils/api';

export default function Badges() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/badges')
      .then(res => setBadges(res.data))
      .catch(() => toast.error('ব্যাজ লোড করতে সমস্যা হয়েছে'))
      .finally(() => setLoading(false));
  }, []);

  const earnedCount = badges.filter(b => b.earned).length;

  if (loading) {
    return (
      <StudentLayout title="Badges">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="🎖️ Badges">
      {/* Summary */}
      <div className="card mb-6 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-brand-navy">তোমার ব্যাজ সংগ্রহ</h3>
            <p className="text-sm text-gray-600">
              {earnedCount}/{badges.length} ব্যাজ অর্জিত
            </p>
          </div>
          <div className="text-4xl">🏅</div>
        </div>
        <div className="mt-3 bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
            style={{ width: `${badges.length ? (earnedCount / badges.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Badges Grid */}
      {badges.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🎖️</div>
          <h3 className="text-xl font-bold text-brand-navy mb-2">ব্যাজ শীঘ্রই আসছে!</h3>
          <p className="text-gray-500">প্র্যাকটিস করে ব্যাজ অর্জন করো।</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`card text-center transition hover:shadow-md ${
                badge.earned ? '' : 'opacity-50 grayscale'
              }`}
            >
              <div className={`text-4xl mb-2 ${badge.earned ? 'animate-bounce-slow' : ''}`}>
                {badge.icon || '🎖️'}
              </div>
              <h4 className="font-semibold text-sm text-brand-navy mb-1">{badge.name}</h4>
              <p className="text-xs text-gray-500">{badge.description}</p>
              {badge.earned ? (
                <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  ✅ অর্জিত
                </span>
              ) : (
                <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  🔒 লক করা
                </span>
              )}
              {badge.earned_at && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(badge.earned_at).toLocaleDateString('bn-BD')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
