import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = () => {
    setLoading(true);
    api.get('/admin/batches')
      .then(res => setBatches(res.data))
      .catch(() => toast.error('Batches লোড করতে সমস্যা হয়েছে'))
      .finally(() => setLoading(false));
  };

  const openCreateModal = () => {
    setEditingBatch(null);
    setForm({ name: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (batch) => {
    setEditingBatch(batch);
    setForm({ name: batch.name || '', description: batch.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Batch name আবশ্যক');
      return;
    }

    setSaving(true);
    try {
      if (editingBatch) {
        await api.put(`/admin/batches/${editingBatch.id}`, form);
        toast.success('Batch আপডেট হয়েছে!');
      } else {
        await api.post('/admin/batches', form);
        toast.success('নতুন batch তৈরি হয়েছে!');
      }
      setShowModal(false);
      fetchBatches();
    } catch (err) {
      toast.error(err.response?.data?.error || 'সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (batch) => {
    if (!confirm(`"${batch.name}" batch মুছে ফেলতে চান?`)) return;
    try {
      await api.delete(`/admin/batches/${batch.id}`);
      toast.success('Batch মুছে ফেলা হয়েছে');
      fetchBatches();
    } catch {
      toast.error('ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Batches">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="📦 Batches">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600 text-sm">মোট {batches.length}টি batch</p>
        <button onClick={openCreateModal} className="btn-primary text-sm">
          ➕ New Batch
        </button>
      </div>

      {/* Batch Cards */}
      {batches.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-bold text-brand-navy mb-2">কোনো batch নেই</h3>
          <p className="text-gray-500 mb-4">Students কে organize করতে batch তৈরি করুন।</p>
          <button onClick={openCreateModal} className="btn-primary">➕ Create First Batch</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map(batch => (
            <div key={batch.id} className="card hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-brand-navy text-lg">{batch.name}</h4>
                  {batch.description && (
                    <p className="text-sm text-gray-500 mt-1">{batch.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-navy-50 px-3 py-1 rounded-full">
                  <span className="text-sm">👥</span>
                  <span className="text-sm font-bold text-brand-navy">{batch.student_count || 0}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEditModal(batch)}
                  className="btn-secondary text-xs py-2 px-3 flex-1"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(batch)}
                  className="btn-danger text-xs py-2 px-3 flex-1"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-brand-navy mb-4">
              {editingBatch ? '✏️ Edit Batch' : '➕ New Batch'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Batch 2024 - January"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Saving...' : editingBatch ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
