import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    spaced_repetition: {
      intervals: [1, 3, 7, 14, 30],
    },
    xp: {
      correct_first_attempt: 10,
      correct_second_attempt: 7,
      correct_third_attempt: 5,
    },
    features: {
      leaderboard_enabled: true,
      recording_enabled: true,
      tts_enabled: true,
      self_registration: true,
    },
    branding: {
      app_name: 'Pro English BD',
      tagline: 'ঠান্ডা মাথায় ইংলিশ শিখি',
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then(res => {
        if (res.data && Object.keys(res.data).length > 0) {
          setSettings(prev => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => toast.error('Settings লোড করতে সমস্যা হয়েছে'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('Settings সেভ হয়েছে!');
    } catch {
      toast.error('সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const updateIntervals = (value) => {
    const intervals = value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
    setSettings(prev => ({
      ...prev,
      spaced_repetition: { ...prev.spaced_repetition, intervals },
    }));
  };

  const updateXP = (key, value) => {
    setSettings(prev => ({
      ...prev,
      xp: { ...prev.xp, [key]: parseInt(value) || 0 },
    }));
  };

  const toggleFeature = (key) => {
    setSettings(prev => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }));
  };

  const updateBranding = (key, value) => {
    setSettings(prev => ({
      ...prev,
      branding: { ...prev.branding, [key]: value },
    }));
  };

  if (loading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="⚙️ Settings">
      <div className="max-w-3xl space-y-6">
        {/* Spaced Repetition */}
        <div className="card">
          <h3 className="text-lg font-bold text-brand-navy mb-4">🧠 Spaced Repetition</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Intervals (days, comma separated)
            </label>
            <input
              type="text"
              value={settings.spaced_repetition.intervals.join(', ')}
              onChange={(e) => updateIntervals(e.target.value)}
              className="input-field"
              placeholder="1, 3, 7, 14, 30"
            />
            <p className="text-xs text-gray-500 mt-1">
              প্রতিটি সফল review-এর পর পরবর্তী review-এর জন্য দিনের ব্যবধান
            </p>
          </div>
        </div>

        {/* XP Values */}
        <div className="card">
          <h3 className="text-lg font-bold text-brand-navy mb-4">⚡ XP Values</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">1st Attempt</label>
              <input
                type="number"
                value={settings.xp.correct_first_attempt}
                onChange={(e) => updateXP('correct_first_attempt', e.target.value)}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">2nd Attempt</label>
              <input
                type="number"
                value={settings.xp.correct_second_attempt}
                onChange={(e) => updateXP('correct_second_attempt', e.target.value)}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">3rd Attempt</label>
              <input
                type="number"
                value={settings.xp.correct_third_attempt}
                onChange={(e) => updateXP('correct_third_attempt', e.target.value)}
                className="input-field"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="card">
          <h3 className="text-lg font-bold text-brand-navy mb-4">🎛️ Feature Toggles</h3>
          <div className="space-y-4">
            {[
              { key: 'leaderboard_enabled', label: 'Leaderboard', desc: 'স্টুডেন্টদের র‌্যাঙ্কিং দেখানো', icon: '🏆' },
              { key: 'recording_enabled', label: 'Voice Recording', desc: 'স্টুডেন্ট নিজের উচ্চারণ রেকর্ড করতে পারবে', icon: '🎙️' },
              { key: 'tts_enabled', label: 'Text-to-Speech', desc: 'Browser TTS fallback ব্যবহার করা', icon: '🔊' },
              { key: 'self_registration', label: 'Self Registration', desc: 'স্টুডেন্ট নিজে অ্যাকাউন্ট তৈরি করতে পারবে', icon: '📝' },
            ].map(feature => (
              <div key={feature.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{feature.icon}</span>
                  <div>
                    <p className="font-medium text-sm text-gray-800">{feature.label}</p>
                    <p className="text-xs text-gray-500">{feature.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFeature(feature.key)}
                  className={`relative w-12 h-6 rounded-full transition ${
                    settings.features[feature.key] ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.features[feature.key] ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Branding */}
        <div className="card">
          <h3 className="text-lg font-bold text-brand-navy mb-4">🎨 Branding</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
              <input
                type="text"
                value={settings.branding.app_name}
                onChange={(e) => updateBranding('app_name', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input
                type="text"
                value={settings.branding.tagline}
                onChange={(e) => updateBranding('tagline', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
