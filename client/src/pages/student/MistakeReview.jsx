import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import StudentLayout from '../../components/StudentLayout';
import api from '../../utils/api';

export default function MistakeReview() {
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchMistakes();
  }, [categoryFilter]);

  const fetchMistakes = () => {
    setLoading(true);
    const params = categoryFilter ? { category: categoryFilter } : {};
    api.get('/student/mistakes', { params })
      .then(res => setMistakes(res.data || []))
      .catch(() => toast.error('ভুলগুলো লোড করতে সমস্যা হয়েছে'))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <StudentLayout title="Mistake Review">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="📝 Mistake Review">
      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: '', label: 'সবগুলো' },
          { key: 'ielts', label: 'IELTS' },
          { key: 'phrase', label: 'Phrase' },
          { key: 'sentence', label: 'Sentence' },
          { key: 'passage', label: 'Passage' },
        ].map(cat => (
          <button key={cat.key} onClick={() => setCategoryFilter(cat.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${categoryFilter === cat.key ? 'bg-brand-navy text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="card mb-4 py-3">
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-green-200 rounded"></span> সঠিক</span>
          <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-red-200 rounded"></span> ভুল</span>
          <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-yellow-200 rounded"></span> বাদ পড়া</span>
        </div>
      </div>

      {/* Mistakes List */}
      {mistakes.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-brand-navy mb-2">কোনো ভুল নেই!</h3>
          <p className="text-gray-500">তুমি দারুণ করছো! প্র্যাকটিস চালিয়ে যাও।</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mistakes.map((mistake, idx) => (
            <div key={mistake.id || idx} className="card border-l-4 border-l-red-400">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  mistake.category === 'ielts' ? 'bg-blue-100 text-blue-700' :
                  mistake.category === 'phrase' ? 'bg-purple-100 text-purple-700' :
                  mistake.category === 'sentence' ? 'bg-green-100 text-green-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {mistake.category}
                </span>
                <div className="text-xs text-gray-400 text-right">
                  <span>ভুল: {mistake.wrong_count}x</span>
                  {mistake.last_mistake_date && <span className="ml-2">{new Date(mistake.last_mistake_date).toLocaleDateString('bn-BD')}</span>}
                </div>
              </div>

              {/* Correct Answer - from correct_text field */}
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1 font-medium">✅ সঠিক উত্তর:</p>
                <p className="font-mono text-sm bg-green-50 p-3 rounded-lg border border-green-200 text-green-800">
                  {mistake.correct_text || 'N/A'}
                </p>
              </div>

              {/* Student's Wrong Answer - from last_wrong_answer field */}
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1 font-medium">❌ তোমার উত্তর:</p>
                <p className="font-mono text-sm bg-red-50 p-3 rounded-lg border border-red-200 text-red-800">
                  {mistake.last_wrong_answer || '(কোনো উত্তর রেকর্ড নেই)'}
                </p>
              </div>

              {/* Word-level differences from backend */}
              {mistake.differences && mistake.differences.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1 font-medium">📊 তুলনা:</p>
                  <div className="flex flex-wrap gap-1 bg-gray-50 p-3 rounded-lg border">
                    {mistake.differences.map((d, i) => (
                      <span key={i} className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                        d.status === 'correct' ? 'bg-green-100 text-green-700' : 
                        d.status === 'wrong' ? 'bg-red-100 text-red-700' : 
                        d.status === 'missing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {d.status === 'wrong' ? (
                          <>{d.studentWord} → <strong>{d.word}</strong></>
                        ) : d.status === 'missing' ? (
                          <>___({d.word})</>
                        ) : (
                          d.word
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Next review info */}
              {mistake.next_review_at && (
                <p className="text-xs text-gray-400">পরবর্তী রিভিউ: {new Date(mistake.next_review_at).toLocaleDateString('bn-BD')}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
