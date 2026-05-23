import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    active: '',
    has_audio: '',
    search: '',
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchItems();
  }, [filters, page]);

  const fetchItems = () => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (filters.category) params.category = filters.category;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.active !== '') params.active = filters.active;
    if (filters.has_audio !== '') params.has_audio = filters.has_audio;
    if (filters.search) params.search = filters.search;

    api.get('/admin/items', { params })
      .then(res => {
        setItems(res.data.items || res.data);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch(() => toast.error('Items লোড করতে সমস্যা হয়েছে'))
      .finally(() => setLoading(false));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`${selectedIds.length}টি আইটেম মুছে ফেলতে চান?`)) return;

    try {
      await api.delete('/admin/items', { data: { ids: selectedIds } });
      toast.success(`${selectedIds.length}টি আইটেম মুছে ফেলা হয়েছে`);
      setSelectedIds([]);
      fetchItems();
    } catch {
      toast.error('ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  return (
    <AdminLayout title="🎧 Listening Items">
      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="input-field text-sm"
          />
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="input-field text-sm"
          >
            <option value="">All Categories</option>
            <option value="ielts">IELTS</option>
            <option value="phrase">Phrase</option>
            <option value="sentence">Sentence</option>
            <option value="passage">Passage</option>
          </select>
          <select
            value={filters.difficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            className="input-field text-sm"
          >
            <option value="">All Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            value={filters.active}
            onChange={(e) => handleFilterChange('active', e.target.value)}
            className="input-field text-sm"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            value={filters.has_audio}
            onChange={(e) => handleFilterChange('has_audio', e.target.value)}
            className="input-field text-sm"
          >
            <option value="">Audio Status</option>
            <option value="true">Has Audio</option>
            <option value="false">No Audio</option>
          </select>
          <Link to="/admin/items/new" className="btn-primary text-sm text-center">
            ➕ Add Item
          </Link>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="card mb-4 flex items-center justify-between bg-navy-50">
          <span className="text-sm font-medium text-brand-navy">
            {selectedIds.length}টি সিলেক্ট করা হয়েছে
          </span>
          <button onClick={handleBulkDelete} className="btn-danger text-sm py-2 px-4">
            🗑️ Delete Selected
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🎧</div>
          <h3 className="text-xl font-bold text-brand-navy mb-2">কোনো আইটেম নেই</h3>
          <p className="text-gray-500 mb-4">নতুন listening item যোগ করুন।</p>
          <Link to="/admin/items/new" className="btn-primary">➕ Add First Item</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === items.length && items.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Text</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Category</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Difficulty</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Audio</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Status</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="py-3 px-3 max-w-[200px] truncate font-medium">{item.correct_text}</td>
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
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      item.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      item.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.difficulty}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {item.has_audio || item.audio_british || item.audio_australian || item.audio_teacher
                      ? <span className="text-green-500">🔊</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      item.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <Link
                      to={`/admin/items/${item.id}/edit`}
                      className="text-brand-navy hover:underline text-xs font-medium"
                    >
                      ✏️ Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm py-1 px-3 disabled:opacity-50"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600 py-1 px-3">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary text-sm py-1 px-3 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
