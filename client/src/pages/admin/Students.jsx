import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', batch_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchBatches();
  }, []);

  const fetchStudents = () => {
    setLoading(true);
    api.get('/admin/students')
      .then(res => setStudents(res.data))
      .catch(() => toast.error('Students লোড করতে সমস্যা হয়েছে'))
      .finally(() => setLoading(false));
  };

  const fetchBatches = () => {
    api.get('/admin/batches')
      .then(res => setBatches(res.data))
      .catch(() => {});
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

  const openCreateModal = () => {
    setEditingStudent(null);
    setForm({ name: '', email: '', phone: '', password: '', batch_id: '' });
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setForm({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      password: '',
      batch_id: student.batch_id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error('নাম এবং ইমেইল আবশ্যক');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      if (editingStudent) {
        await api.put(`/admin/students/${editingStudent.id}`, payload);
        toast.success('Student আপডেট হয়েছে!');
      } else {
        if (!form.password) {
          toast.error('Password আবশ্যক');
          setSaving(false);
          return;
        }
        await api.post('/admin/students', payload);
        toast.success('নতুন student তৈরি হয়েছে!');
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.error || 'সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (student) => {
    if (!confirm(`${student.name} কে মুছে ফেলতে চান?`)) return;
    try {
      await api.delete(`/admin/students/${student.id}`);
      toast.success('Student মুছে ফেলা হয়েছে');
      fetchStudents();
    } catch {
      toast.error('ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  const handleBatchAssignment = async (studentId, batchId) => {
    try {
      await api.put(`/admin/students/${studentId}`, { batch_id: batchId || null });
      toast.success('Batch assign হয়েছে');
      fetchStudents();
    } catch {
      toast.error('Batch assign করতে সমস্যা হয়েছে');
    }
  };

  return (
    <AdminLayout title="👥 Students">
      {/* Top Bar */}
      <div className="card mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="text"
          placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <button onClick={openCreateModal} className="btn-primary text-sm whitespace-nowrap">
          ➕ Add Student
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-bold text-brand-navy mb-2">কোনো স্টুডেন্ট নেই</h3>
          <p className="text-gray-500 mb-4">নতুন student যোগ করুন।</p>
          <button onClick={openCreateModal} className="btn-primary">➕ Add Student</button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Name</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Email</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium hidden sm:table-cell">Phone</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Batch</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium hidden sm:table-cell">XP</th>
                <th className="text-left py-3 px-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium">{student.name}</td>
                  <td className="py-3 px-3 text-gray-600">{student.email}</td>
                  <td className="py-3 px-3 text-gray-600 hidden sm:table-cell">{student.phone || '-'}</td>
                  <td className="py-3 px-3">
                    <select
                      value={student.batch_id || ''}
                      onChange={(e) => handleBatchAssignment(student.id, e.target.value)}
                      className="text-xs border rounded-lg px-2 py-1"
                    >
                      <option value="">No Batch</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell font-medium text-brand-navy">{student.xp || 0}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(student)} className="text-brand-navy hover:underline text-xs">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDelete(student)} className="text-red-500 hover:underline text-xs">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-brand-navy mb-4">
              {editingStudent ? '✏️ Edit Student' : '➕ New Student'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="Student name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field"
                  placeholder="student@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="input-field"
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingStudent ? '(leave blank to keep)' : '*'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  className="input-field"
                  placeholder="••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                <select
                  value={form.batch_id}
                  onChange={(e) => setForm(prev => ({ ...prev, batch_id: e.target.value }))}
                  className="input-field"
                >
                  <option value="">No Batch</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Saving...' : editingStudent ? 'Update' : 'Create'}
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
