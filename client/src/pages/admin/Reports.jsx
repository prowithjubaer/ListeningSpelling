import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('accuracy');
  const [accuracyData, setAccuracyData] = useState([]);
  const [difficultItems, setDifficultItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const fetchReport = () => {
    setLoading(true);
    if (activeTab === 'accuracy') {
      api.get('/admin/reports/accuracy')
        .then(res => setAccuracyData(res.data))
        .catch(() => toast.error('রিপোর্ট লোড করতে সমস্যা হয়েছে'))
        .finally(() => setLoading(false));
    } else {
      api.get('/admin/reports/difficult-items')
        .then(res => setDifficultItems(res.data))
        .catch(() => toast.error('রিপোর্ট লোড করতে সমস্যা হয়েছে'))
        .finally(() => setLoading(false));
    }
  };

  return (
    <AdminLayout title="📈 Reports">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('accuracy')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition ${
            activeTab === 'accuracy'
              ? 'bg-brand-navy text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          🎯 Student Accuracy
        </button>
        <button
          onClick={() => setActiveTab('difficult')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition ${
            activeTab === 'difficult'
              ? 'bg-brand-navy text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          🔴 Difficult Items
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
        </div>
      ) : (
        <>
          {/* Student Accuracy Report */}
          {activeTab === 'accuracy' && (
            <div className="card">
              <h3 className="text-lg font-bold text-brand-navy mb-4">🎯 Student Accuracy Report</h3>
              {accuracyData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📊</div>
                  <p className="text-gray-500">কোনো ডেটা নেই। Students প্র্যাকটিস শুরু করলে রিপোর্ট দেখা যাবে।</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-3 text-gray-500 font-medium">#</th>
                        <th className="text-left py-3 px-3 text-gray-500 font-medium">Student</th>
                        <th className="text-left py-3 px-3 text-gray-500 font-medium">Total Attempts</th>
                        <th className="text-left py-3 px-3 text-gray-500 font-medium">Correct</th>
                        <th className="text-left py-3 px-3 text-gray-500 font-medium">Accuracy</th>
                        <th className="text-left py-3 px-3 text-gray-500 font-medium">Streak</th>
                        <th className="text-left py-3 px-3 text-gray-500 font-medium">XP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accuracyData.map((student, idx) => (
                        <tr key={student.id || idx} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-3 text-gray-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-medium">{student.name}</td>
                          <td className="py-3 px-3">{student.total_attempts || 0}</td>
                          <td className="py-3 px-3 text-green-600">{student.correct_count || 0}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    (student.accuracy || 0) >= 80 ? 'bg-green-500' :
                                    (student.accuracy || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(100, student.accuracy || 0)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">{student.accuracy || 0}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-orange-500">🔥 {student.streak || 0}</span>
                          </td>
                          <td className="py-3 px-3 font-bold text-brand-navy">{student.xp || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Difficult Items Report */}
          {activeTab === 'difficult' && (
            <div className="card">
              <h3 className="text-lg font-bold text-brand-navy mb-4">🔴 Most Difficult Items</h3>
              <p className="text-sm text-gray-500 mb-4">যেসব আইটেমে সবচেয়ে বেশি ভুল হচ্ছে</p>
              {difficultItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">🎧</div>
                  <p className="text-gray-500">কোনো ডেটা নেই। Students প্র্যাকটিস শুরু করলে রিপোর্ট দেখা যাবে।</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-3 text-gray-500 font-medium">#</th>
                        <th className="text-left py-3 px-3 text-gray-500 font-medium">Text</th>
                        <th className="text-left py-3 px-3 text-gray-500 font-medium">Category</th>
                        <th className="text-left py-3 px-3 text-gray-500 font-medium">Attempts</th>
                        <th className="text-left py-3 px-3 text-gray-500 font-medium">Fail Rate</th>
                        <th className="text-left py-3 px-3 text-gray-500 font-medium">Avg Attempts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {difficultItems.map((item, idx) => (
                        <tr key={item.id || idx} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-3 text-gray-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-medium max-w-[200px] truncate">{item.correct_text}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              item.category === 'ielts' ? 'bg-blue-100 text-blue-700' :
                              item.category === 'phrase' ? 'bg-purple-100 text-purple-700' :
                              item.category === 'sentence' ? 'bg-green-100 text-green-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-3">{item.total_attempts || 0}</td>
                          <td className="py-3 px-3">
                            <span className={`font-medium ${
                              (item.fail_rate || 0) >= 70 ? 'text-red-600' :
                              (item.fail_rate || 0) >= 40 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {item.fail_rate || 0}%
                            </span>
                          </td>
                          <td className="py-3 px-3">{item.avg_attempts || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
