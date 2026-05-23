import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import StudentLayout from '../../components/StudentLayout';
import api from '../../utils/api';

export default function MistakeReview() {
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = ['all', 'ielts', 'phrase', 'sentence', 'passage'];

  useEffect(() => {
    fetchMistakes();
  }, []);

  const fetchMistakes = () => {
    setLoading(true);
    api.get('/student/mistakes')
      .then(res => setMistakes(res.data))
      .catch(() => toast.error('ভুলগুলো লোড করতে সমস্যা হয়েছে'))
      .finally(() => setLoading(false));
  };

  const filteredMistakes = categoryFilter === 'all'
    ? mistakes
    : mistakes.filter(m => m.category === categoryFilter);

  const highlightDifferences = (correct, wrong) => {
    if (!correct || !wrong) return { correctParts: [], wrongParts: [] };

    const correctWords = correct.split('');
    const wrongWords = wrong.split('');
    const maxLen = Math.max(correctWords.length, wrongWords.length);

    const correctParts = [];
    const wrongParts = [];

    for (let i = 0; i < maxLen; i++) {
      const correctChar = correctWords[i];
      const wrongChar = wrongWords[i];

      if (correctChar && wrongChar) {
        if (correctChar.toLowerCase() === wrongChar.toLowerCase()) {
          correctParts.push({ char: correctChar, type: 'match' });
          wrongParts.push({ char: wrongChar, type: 'match' });
        } else {
          correctParts.push({ char: correctChar, type: 'correct' });
          wrongParts.push({ char: wrongChar, type: 'wrong' });
        }
      } else if (correctChar && !wrongChar) {
        correctParts.push({ char: correctChar, type: 'missing' });
      } else if (!correctChar && wrongChar) {
        wrongParts.push({ char: wrongChar, type: 'wrong' });
      }
    }

    return { correctParts, wrongParts };
  };

  const renderHighlighted = (parts, type) => {
    return parts.map((part, i) => {
      let className = '';
      if (part.type === 'correct') className = 'bg-green-200 text-green-800 px-0.5 rounded';
      else if (part.type === 'wrong') className = 'bg-red-200 text-red-800 px-0.5 rounded';
      else if (part.type === 'missing') className = 'bg-yellow-200 text-yellow-800 px-0.5 rounded';
      else className = '';

      return <span key={i} className={className}>{part.char}</span>;
    });
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
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              categoryFilter === cat
                ? 'bg-brand-navy text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat === 'all' ? 'সবগুলো' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="card mb-4 py-3">
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 bg-green-200 rounded"></span> সঠিক অক্ষর
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 bg-red-200 rounded"></span> ভুল অক্ষর
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 bg-yellow-200 rounded"></span> বাদ পড়া অক্ষর
          </span>
        </div>
      </div>

      {/* Mistakes List */}
      {filteredMistakes.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-brand-navy mb-2">কোনো ভুল নেই!</h3>
          <p className="text-gray-500">তুমি দারুণ করছো! প্র্যাকটিস চালিয়ে যাও।</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMistakes.map((mistake, idx) => {
            const { correctParts, wrongParts } = highlightDifferences(
              mistake.correct_answer || mistake.correct_text,
              mistake.user_answer
            );

            return (
              <div key={mistake.id || idx} className="card">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    mistake.category === 'ielts' ? 'bg-blue-100 text-blue-700' :
                    mistake.category === 'phrase' ? 'bg-purple-100 text-purple-700' :
                    mistake.category === 'sentence' ? 'bg-green-100 text-green-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {mistake.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    {mistake.created_at ? new Date(mistake.created_at).toLocaleDateString('bn-BD') : ''}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">✅ সঠিক উত্তর:</p>
                    <p className="font-mono text-sm bg-green-50 p-2 rounded-lg border border-green-100">
                      {renderHighlighted(correctParts, 'correct')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">❌ তোমার উত্তর:</p>
                    <p className="font-mono text-sm bg-red-50 p-2 rounded-lg border border-red-100">
                      {renderHighlighted(wrongParts, 'wrong')}
                    </p>
                  </div>
                </div>

                {mistake.attempts && (
                  <p className="text-xs text-gray-400 mt-2">Attempts: {mistake.attempts}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
}
