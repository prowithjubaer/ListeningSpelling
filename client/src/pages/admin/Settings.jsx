import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then(res => {
        // Backend returns flat: { key: "value", key: "value", ... }
        setSettings(res.data || {});
      })
      .catch(() => toast.error('Settings লোড করতে সমস্যা হয়েছে'))
      .finally(() => setLoading(false));
  }, []);

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: String(value) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('Settings সেভ হয়েছে! ✅');
    } catch (err) {
      toast.error('সেভ করতে সমস্যা হয়েছে: ' + (err.response?.data?.error || ''));
    } finally {
      setSaving(false);
    }
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
          <h3 className="text-lg font-bold text-brand-navy mb-4">🧠 Spaced Repetition Intervals</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ভুল Review ১ (দিন)</label>
              <input type="number" value={settings.wrong_review_1_days || '1'} onChange={e => update('wrong_review_1_days', e.target.value)} className="input-field" min="1" />
              <p className="text-xs text-gray-400 mt-1">প্রথম ভুলের পর কত দিন পরে আবার দেখাবে</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ভুল Review ২ (দিন)</label>
              <input type="number" value={settings.wrong_review_2_days || '3'} onChange={e => update('wrong_review_2_days', e.target.value)} className="input-field" min="1" />
              <p className="text-xs text-gray-400 mt-1">দ্বিতীয় বার ভুল হলে</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">সঠিক Review ১ (দিন)</label>
              <input type="number" value={settings.correct_review_1_days || '7'} onChange={e => update('correct_review_1_days', e.target.value)} className="input-field" min="1" />
              <p className="text-xs text-gray-400 mt-1">সঠিক হলে কত দিন পরে review</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">সঠিক Review ২ / Mastery (দিন)</label>
              <input type="number" value={settings.correct_review_2_days || '30'} onChange={e => update('correct_review_2_days', e.target.value)} className="input-field" min="1" />
              <p className="text-xs text-gray-400 mt-1">দ্বিতীয়বার সঠিক হলে mastered</p>
            </div>
          </div>
        </div>

        {/* XP Values */}
        <div className="card">
          <h3 className="text-lg font-bold text-brand-navy mb-4">⚡ XP Points</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">1st Attempt সঠিক</label>
              <input type="number" value={settings.xp_correct_first || '10'} onChange={e => update('xp_correct_first', e.target.value)} className="input-field" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">2nd Attempt সঠিক</label>
              <input type="number" value={settings.xp_correct_second || '6'} onChange={e => update('xp_correct_second', e.target.value)} className="input-field" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">3rd Attempt সঠিক</label>
              <input type="number" value={settings.xp_correct_third || '3'} onChange={e => update('xp_correct_third', e.target.value)} className="input-field" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shadowing Recording</label>
              <input type="number" value={settings.xp_shadowing || '3'} onChange={e => update('xp_shadowing', e.target.value)} className="input-field" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Bonus</label>
              <input type="number" value={settings.xp_daily_bonus || '20'} onChange={e => update('xp_daily_bonus', e.target.value)} className="input-field" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Mastered</label>
              <input type="number" value={settings.xp_mastered || '15'} onChange={e => update('xp_mastered', e.target.value)} className="input-field" min="0" />
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="card">
          <h3 className="text-lg font-bold text-brand-navy mb-4">🎛️ Feature Toggles</h3>
          <div className="space-y-3">
            {[
              { key: 'leaderboard_enabled', label: 'Leaderboard', desc: 'স্টুডেন্টদের র‌্যাঙ্কিং দেখানো', icon: '🏆' },
              { key: 'recording_enabled', label: 'Voice Recording', desc: 'স্টুডেন্ট রেকর্ড করতে পারবে', icon: '🎙️' },
              { key: 'save_recordings_to_server', label: 'Save Recordings to Server', desc: 'রেকর্ডিং সার্ভারে সেভ করা', icon: '💾' },
              { key: 'tts_fallback_enabled', label: 'TTS Fallback', desc: 'অডিও না থাকলে browser TTS ব্যবহার', icon: '🔊' },
              { key: 'self_registration_enabled', label: 'Self Registration', desc: 'স্টুডেন্ট নিজে অ্যাকাউন্ট তৈরি করতে পারবে', icon: '📝' },
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
                  onClick={() => update(feature.key, settings[feature.key] === '1' ? '0' : '1')}
                  className={`relative w-12 h-6 rounded-full transition ${settings[feature.key] === '1' ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[feature.key] === '1' ? 'translate-x-6' : 'translate-x-0.5'}`} />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
              <input type="text" value={settings.brand_name || ''} onChange={e => update('brand_name', e.target.value)} className="input-field" placeholder="Pro English BD" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input type="text" value={settings.brand_tagline || ''} onChange={e => update('brand_tagline', e.target.value)} className="input-field" placeholder="ঠান্ডা মাথায় ইংলিশ শিখি" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Accent</label>
              <select value={settings.default_accent || 'british'} onChange={e => update('default_accent', e.target.value)} className="input-field">
                <option value="british">🇬🇧 British</option>
                <option value="american">🇺🇸 American</option>
                <option value="australian">🇦🇺 Australian</option>
                <option value="newzealand">🇳🇿 New Zealand</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leaderboard Privacy</label>
              <select value={settings.leaderboard_privacy || 'partial'} onChange={e => update('leaderboard_privacy', e.target.value)} className="input-field">
                <option value="full">Full name দেখানো</option>
                <option value="partial">Partial name (Ab***z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3 pb-8">
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
