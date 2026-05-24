import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import StudentLayout from '../../components/StudentLayout';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/dashboard')
      .then(res => setData(res.data))
      .catch(() => toast.error('ড্যাশবোর্ড লোড করতে সমস্যা হয়েছে'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <StudentLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
        </div>
      </StudentLayout>
    );
  }

  // Backend returns flat: { user, accuracy, totalAttempts, todayPracticed, dueReviews, mistakes, mastered, categoryProgress, rank }
  const accuracy = data?.accuracy || 0;
  const xp = data?.user?.xp || user?.xp || 0;
  const streak = data?.user?.streak || user?.streak || 0;
  const rank = data?.rank || '-';
  const dueReviews = data?.dueReviews || 0;
  const mistakes = data?.mistakes || 0;
  const mastered = data?.mastered || 0;
  const todayPracticed = data?.todayPracticed || 0;
  const categoryProgress = data?.categoryProgress || [];

  const categories = [
    { key: 'ielts', label: 'IELTS Words', icon: '📚', color: 'from-blue-500 to-blue-600', desc: 'IELTS vocabulary practice' },
    { key: 'phrase', label: 'Phrases', icon: '💬', color: 'from-purple-500 to-purple-600', desc: 'Common English phrases' },
    { key: 'sentence', label: 'Sentences', icon: '📝', color: 'from-green-500 to-green-600', desc: 'Full sentence dictation' },
    { key: 'passage', label: 'Passages', icon: '📖', color: 'from-orange-500 to-orange-600', desc: 'Paragraph listening' },
  ];

  const motivationalMessages = [
    'প্রতিদিন একটু একটু করে এগিয়ে যাও! 🚀',
    'ভুল থেকেই শেখা হয়, হাল ছেড়ো না! 💪',
    'তোমার ধারাবাহিকতা তোমাকে সফল করবে! 🔥',
    'আজকের প্র্যাকটিস আগামীর সাফল্য! ⭐',
  ];
  const todayMessage = motivationalMessages[new Date().getDay() % motivationalMessages.length];

  return (
    <StudentLayout title="Dashboard">
      {/* Motivational Banner */}
      <div className="card bg-gradient-to-r from-brand-navy to-navy-600 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">স্বাগতম, {data?.user?.name || user?.name || 'Student'}! 👋</h3>
            <p className="text-navy-200 text-sm">{todayMessage}</p>
          </div>
          <div className="hidden sm:block text-4xl">🎯</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-3xl mb-1">🎯</div>
          <p className="text-2xl font-bold text-brand-navy">{accuracy}%</p>
          <p className="text-xs text-gray-500">Accuracy</p>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-1">⚡</div>
          <p className="text-2xl font-bold text-yellow-500">{xp}</p>
          <p className="text-xs text-gray-500">Total XP</p>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-1">🔥</div>
          <p className="text-2xl font-bold text-orange-500">{streak}</p>
          <p className="text-xs text-gray-500">Day Streak</p>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-1">🏆</div>
          <p className="text-2xl font-bold text-purple-500">#{rank}</p>
          <p className="text-xs text-gray-500">Rank</p>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold text-brand-navy mb-4">📅 আজকের অগ্রগতি ({todayPracticed} practiced today)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <p className="text-2xl font-bold text-blue-600">{dueReviews}</p>
            <p className="text-xs text-gray-600">Due Reviews</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-xl">
            <p className="text-2xl font-bold text-red-600">{mistakes}</p>
            <p className="text-xs text-gray-600">Mistakes</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <p className="text-2xl font-bold text-green-600">{mastered}</p>
            <p className="text-xs text-gray-600">Mastered</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {dueReviews > 0 && (
          <Link to="/practice?mode=review" className="card hover:shadow-md transition flex items-center gap-4 group border-2 border-blue-200 bg-blue-50">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition">🔄</div>
            <div>
              <h4 className="font-semibold text-brand-navy">Due Reviews</h4>
              <p className="text-sm text-gray-500">{dueReviews}টি রিভিউ বাকি আছে</p>
            </div>
          </Link>
        )}
        {mistakes > 0 && (
          <Link to="/mistakes" className="card hover:shadow-md transition flex items-center gap-4 group border-2 border-red-200 bg-red-50">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition">📝</div>
            <div>
              <h4 className="font-semibold text-brand-navy">Mistake Review</h4>
              <p className="text-sm text-gray-500">{mistakes}টি ভুল ঠিক করো</p>
            </div>
          </Link>
        )}
      </div>

      {/* Category Progress */}
      {categoryProgress.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-lg font-bold text-brand-navy mb-3">📊 Category Progress</h3>
          <div className="space-y-2">
            {categoryProgress.map(cp => (
              <div key={cp.category} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="capitalize font-medium text-sm">{cp.category}</span>
                <span className="text-sm text-gray-600">{cp.mastered_count}/{cp.total} mastered</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practice Categories */}
      <h3 className="text-lg font-bold text-brand-navy mb-4">🎧 প্র্যাকটিস ক্যাটাগরি</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map(cat => (
          <Link key={cat.key} to={`/practice/${cat.key}`} className="card hover:shadow-md transition group">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${cat.color} rounded-xl flex items-center justify-center text-2xl text-white group-hover:scale-110 transition`}>
                {cat.icon}
              </div>
              <div>
                <h4 className="font-semibold text-brand-navy">{cat.label}</h4>
                <p className="text-sm text-gray-500">{cat.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </StudentLayout>
  );
}
