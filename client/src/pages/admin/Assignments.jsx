import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    assign_to: 'batch',
    batch_id: '',
    student_ids: [],
    category: '',
    due_date: '',
    daily_target: 10,
  });

  useEffect(() => {
    fetchAssignments();
    fetchBatches();
    fetchStudents();
  }, []);

  const fetchAssignments = () => {
    setLoading(true);
    api.get('/admin/assignments')
      .then(res => setAssignments(res.data))
      .catch(() => toast.error('Assignments লোড করতে সমস্যা হয়েছে'))
      .finally(() => setLoading(false));
  };

  const fetchBatches = () => {
    api.get('/admin/batches')
      .then(res => setBatches(res.data))
      .catch(() => {});
  };

  const fetchStudents = () => {
    api.get('/admin/students')
      .then(res => setStudents(res.data))
      .catch(() => {});
  };

  const openCreateModal = () => {
    setForm({
      title: '',
      assign_to: 'batch',
      batch_id: '',
      student_ids: [],
      category: '',
      due_date: '',
      daily_target: 10,
    });
    setShowModal(true);
  };

  const handleStudentToggle = (studentId) => {
    setForm(prev => ({
      ...prev,
      student_ids: prev.student_ids.includes(studentId)
        ? prev.student_ids.filter(id => id !== studentId)
        : [...prev.student_ids, studentId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title আবশ্যক');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        category: form.category,
        due_date: form.due_date,
        daily_target: form.daily_target,
      };

      if (form.assign_to === 'batch') {
        payload.batch_id = form.batch_id;
      } else {
        payload.student_ids = form.student_ids;
      }

      await api.post('/admin/assignments', payload);
      toast.success('Assignment তৈরি হয়েছে!');
      setShowModal(false);
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assignment) => {
    if (!confirm(`"${assignment.title}" মুছে ফেলতে চান?`)) return;
    try {
      await api.delete(`/admin/assignments/${assignment.id}`);
      toast.success('Assignment মুছে ফেলা হয়েছে');
      fetchAssignments();
    } catch {
      toast.error('ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  return (
    <AdminLayout title="📋 Assignments">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600 text-sm">মোট {assignments.length}টি assignment</p>
        <button onClick={openCreateModal} className="btn-primary text-sm">
          ➕ New Assignment
        </button>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-brand-navy mb-2">কোনো assignment নেই</h3>
          <p className="text-gray-500 mb-4">Students-দের জন্য assignment তৈরি করুন।</p>
          <button onClick={openCreateModal} className="btn-primary">➕ Create Assignment</button>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(assignment => (
            <div key={assignment.id} className="card hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-brand-navy">{assignment.title}</h4>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    {assignment.category && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {assignment.category}
                      </span>
                    )}
                    {assignment.batch_name && (
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                        📦 {assignment.batch_name}
                      </span>
                    )}
                    <span>🎯 Daily: {assignment.daily_target || '-'}</span>
                    {assignment.due_date && (
                      <span>📅 Due: {new Date(assignment.due_date).toLocaleDateString('bn-BD')}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(assignment)}
                  className="text-red-400 hover:text-red-600 text-sm ml-3"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 my-8">
            <h3 className="text-lg font-bold text-brand-navy mb-4">➕ New Assignment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Week 1 IELTS Practice"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="input-field"
                >
                  <option value="">All Categories</option>
                  <option value="ielts">IELTS</option>
                  <option value="phrase">Phrase</option>
                  <option value="sentence">Sentence</option>
                  <option value="passage">Passage</option>
                </select>
              </div>

              {/* Assign To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <div className="flex gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, assign_to: 'batch' }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      form.assign_to === 'batch' ? 'bg-brand-navy text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    📦 Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, assign_to: 'student' }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      form.assign_to === 'student' ? 'bg-brand-navy text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    👤 Students
                  </button>
                </div>

                {form.assign_to === 'batch' ? (
                  <select
                    value={form.batch_id}
                    onChange={(e) => setForm(prev => ({ ...prev, batch_id: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Select Batch</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="max-h-40 overflow-y-auto border rounded-xl p-3 space-y-2">
                    {students.length === 0 ? (
                      <p className="text-sm text-gray-400">কোনো student নেই</p>
                    ) : (
                      students.map(s => (
                        <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.student_ids.includes(s.id)}
                            onChange={() => handleStudentToggle(s.id)}
                            className="rounded border-gray-300 text-brand-navy"
                          />
                          <span className="text-sm">{s.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Target</label>
                  <input
                    type="number"
                    value={form.daily_target}
                    onChange={(e) => setForm(prev => ({ ...prev, daily_target: parseInt(e.target.value) || 0 }))}
                    className="input-field"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Assignment'}
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
