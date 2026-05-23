import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

export default function ItemForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: 'ielts',
    difficulty: 'medium',
    correct_text: '',
    note: '',
    tags: '',
    punctuation_mode: 'ignore',
    capitalization_mode: 'ignore',
    use_tts: true,
    xp: 10,
    replay_limit: 5,
    active: true,
  });
  const [audioFiles, setAudioFiles] = useState({
    british: null,
    australian: null,
    teacher: null,
  });

  useEffect(() => {
    if (isEdit) {
      api.get(`/admin/items/${id}`)
        .then(res => {
          const item = res.data;
          setForm({
            category: item.category || 'ielts',
            difficulty: item.difficulty || 'medium',
            correct_text: item.correct_text || '',
            note: item.note || '',
            tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
            punctuation_mode: item.punctuation_mode || 'ignore',
            capitalization_mode: item.capitalization_mode || 'ignore',
            use_tts: item.use_tts !== false,
            xp: item.xp || 10,
            replay_limit: item.replay_limit || 5,
            active: item.active !== false,
          });
        })
        .catch(() => toast.error('আইটেম লোড করতে সমস্যা হয়েছে'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (accent, file) => {
    setAudioFiles(prev => ({ ...prev, [accent]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.correct_text.trim()) {
      toast.error('Correct text আবশ্যক');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('category', form.category);
      formData.append('difficulty', form.difficulty);
      formData.append('correct_text', form.correct_text);
      formData.append('note', form.note);
      formData.append('tags', form.tags);
      formData.append('punctuation_mode', form.punctuation_mode);
      formData.append('capitalization_mode', form.capitalization_mode);
      formData.append('use_tts', form.use_tts);
      formData.append('xp', form.xp);
      formData.append('replay_limit', form.replay_limit);
      formData.append('active', form.active);

      if (audioFiles.british) formData.append('audio_british', audioFiles.british);
      if (audioFiles.australian) formData.append('audio_australian', audioFiles.australian);
      if (audioFiles.teacher) formData.append('audio_teacher', audioFiles.teacher);

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (isEdit) {
        await api.put(`/admin/items/${id}`, formData, config);
        toast.success('আইটেম আপডেট হয়েছে!');
      } else {
        await api.post('/admin/items', formData, config);
        toast.success('নতুন আইটেম তৈরি হয়েছে!');
      }
      navigate('/admin/items');
    } catch (err) {
      toast.error(err.response?.data?.error || 'সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={isEdit ? 'Edit Item' : 'Add New Item'}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEdit ? '✏️ Edit Item' : '➕ Add New Item'}>
      <form onSubmit={handleSubmit} className="max-w-3xl">
        {/* Basic Info */}
        <div className="card mb-4">
          <h3 className="text-lg font-bold text-brand-navy mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="input-field"
              >
                <option value="ielts">IELTS</option>
                <option value="phrase">Phrase</option>
                <option value="sentence">Sentence</option>
                <option value="passage">Passage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
              <select
                value={form.difficulty}
                onChange={(e) => handleChange('difficulty', e.target.value)}
                className="input-field"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Correct Text *</label>
            <textarea
              value={form.correct_text}
              onChange={(e) => handleChange('correct_text', e.target.value)}
              className="input-field min-h-[100px]"
              placeholder="Enter the correct text that students should type..."
              rows={3}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Note / Hint</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => handleChange('note', e.target.value)}
              className="input-field"
              placeholder="Optional hint for students"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              className="input-field"
              placeholder="e.g. academic, travel, health"
            />
          </div>
        </div>

        {/* Audio Uploads */}
        <div className="card mb-4">
          <h3 className="text-lg font-bold text-brand-navy mb-4">🔊 Audio Files</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['british', 'australian', 'teacher'].map(accent => (
              <div key={accent}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {accent === 'british' ? '🇬🇧 British' : accent === 'australian' ? '🇦🇺 Australian' : '👨‍🏫 Teacher'}
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileChange(accent, e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-navy-50 file:text-brand-navy hover:file:bg-navy-100"
                />
                {audioFiles[accent] && (
                  <p className="text-xs text-green-600 mt-1">✅ {audioFiles[accent].name}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="card mb-4">
          <h3 className="text-lg font-bold text-brand-navy mb-4">⚙️ Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Punctuation Mode</label>
              <select
                value={form.punctuation_mode}
                onChange={(e) => handleChange('punctuation_mode', e.target.value)}
                className="input-field"
              >
                <option value="ignore">Ignore</option>
                <option value="strict">Strict</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capitalization Mode</label>
              <select
                value={form.capitalization_mode}
                onChange={(e) => handleChange('capitalization_mode', e.target.value)}
                className="input-field"
              >
                <option value="ignore">Ignore</option>
                <option value="strict">Strict</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">XP Reward</label>
              <input
                type="number"
                value={form.xp}
                onChange={(e) => handleChange('xp', parseInt(e.target.value) || 0)}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Replay Limit</label>
              <input
                type="number"
                value={form.replay_limit}
                onChange={(e) => handleChange('replay_limit', parseInt(e.target.value) || 0)}
                className="input-field"
                min="1"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.use_tts}
                onChange={(e) => handleChange('use_tts', e.target.checked)}
                className="rounded border-gray-300 text-brand-navy focus:ring-brand-navy"
              />
              <span className="text-sm font-medium text-gray-700">Enable TTS Fallback</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => handleChange('active', e.target.checked)}
                className="rounded border-gray-300 text-brand-navy focus:ring-brand-navy"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? '💾 Update Item' : '➕ Create Item'}
          </button>
          <button type="button" onClick={() => navigate('/admin/items')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
