import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import StudentLayout from '../../components/StudentLayout';
import api from '../../utils/api';

export default function Practice() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'new';

  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [accent, setAccent] = useState('british');
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [ttsText, setTtsText] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const inputRef = useRef(null);

  // Load speech synthesis voices early
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices();
      if (voices && voices.length > 0) setVoicesLoaded(true);
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [category, mode]);

  const fetchItems = () => {
    setLoading(true);
    setAnswer('');
    setAttempts(0);
    setFeedback(null);
    setRecordingUrl(null);
    setTtsText('');
    setReplayCount(0);
    setCurrentIndex(0);

    const params = {};
    if (mode && mode !== 'new') params.mode = mode;
    if (category) params.category = category;

    api.get('/student/practice', { params })
      .then(res => {
        setItems(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error('আইটেম লোড করতে সমস্যা হয়েছে');
        setItems([]);
        setLoading(false);
      });
  };

  const item = items[currentIndex] || null;

  const resetForNextItem = () => {
    setAnswer('');
    setAttempts(0);
    setFeedback(null);
    setRecordingUrl(null);
    setTtsText('');
    setReplayCount(0);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const nextItem = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetForNextItem();
    } else {
      toast.success('এই সেশনের সব আইটেম শেষ! 🎉');
      setItems([]);
    }
  };

  const playAudio = useCallback(async () => {
    if (!item) return;
    setIsPlaying(true);
    setReplayCount(c => c + 1);

    // Try uploaded audio first
    const audioFile = accent === 'british' ? item.british_audio_path :
                      accent === 'australian' ? item.australian_audio_path :
                      accent === 'american' ? item.american_audio_path :
                      accent === 'newzealand' ? item.newzealand_audio_path :
                      null;

    if (audioFile) {
      const audio = new Audio(`/uploads/audio/${audioFile}`);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => { setIsPlaying(false); playTTS(); };
      audio.play().catch(() => { setIsPlaying(false); playTTS(); });
      return;
    }

    // TTS fallback
    if (item.tts_enabled) {
      await playTTS();
    } else {
      toast.error('এই আইটেমের জন্য কোনো অডিও নেই');
      setIsPlaying(false);
    }
  }, [item, accent, ttsText]);

  const playTTS = async () => {
    if (!item) { setIsPlaying(false); return; }

    try {
      let text = ttsText;
      if (!text) {
        const res = await api.get(`/student/practice/${item.id}/tts`);
        text = res.data.text;
        setTtsText(text);
      }

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();

        // Precise voice matching for each accent
        let targetVoice = null;

        if (accent === 'british') {
          // Priority order for British English
          targetVoice = voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('female')) ||
                        voices.find(v => v.lang === 'en-GB') ||
                        voices.find(v => v.name.toLowerCase().includes('british')) ||
                        voices.find(v => v.name.includes('Daniel') && v.lang.startsWith('en')) ||
                        voices.find(v => v.name.includes('Kate') && v.lang.startsWith('en'));
          utterance.lang = 'en-GB';
        } else if (accent === 'american') {
          // Priority order for American English
          targetVoice = voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('female')) ||
                        voices.find(v => v.lang === 'en-US') ||
                        voices.find(v => v.name.toLowerCase().includes('american')) ||
                        voices.find(v => v.name.includes('Samantha')) ||
                        voices.find(v => v.name.includes('Alex'));
          utterance.lang = 'en-US';
        } else if (accent === 'australian') {
          // Priority order for Australian English
          targetVoice = voices.find(v => v.lang === 'en-AU') ||
                        voices.find(v => v.name.toLowerCase().includes('australia')) ||
                        voices.find(v => v.name.includes('Karen') && v.lang.startsWith('en')) ||
                        voices.find(v => v.name.includes('Lee') && v.lang.startsWith('en'));
          utterance.lang = 'en-AU';
        } else if (accent === 'newzealand') {
          // Priority order for New Zealand English
          targetVoice = voices.find(v => v.lang === 'en-NZ') ||
                        voices.find(v => v.name.toLowerCase().includes('zealand')) ||
                        voices.find(v => v.name.toLowerCase().includes('new zealand')) ||
                        // NZ is close to Australian, fallback
                        voices.find(v => v.lang === 'en-AU') ||
                        voices.find(v => v.lang === 'en-GB');
          utterance.lang = 'en-NZ';
        }

        // If no specific voice found, use any English voice
        if (!targetVoice) {
          targetVoice = voices.find(v => v.lang.startsWith('en'));
        }

        if (targetVoice) {
          utterance.voice = targetVoice;
          utterance.lang = targetVoice.lang; // Ensure lang matches the found voice
        }

        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      } else {
        toast.error('আপনার browser-এ Speech Synthesis নেই');
        setIsPlaying(false);
      }
    } catch {
      setIsPlaying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim() || !item) return;

    const currentAttempt = attempts + 1;
    setAttempts(currentAttempt);

    try {
      const res = await api.post(`/student/practice/${item.id}/submit`, {
        typed_answer: answer.trim(),
        attempt_number: currentAttempt,
        replay_count: replayCount,
        accent_used: accent
      });

      setFeedback(res.data);

      if (res.data.is_correct) {
        toast.success(`সঠিক! +${res.data.xp_earned} XP 🎉`);
      } else if (currentAttempt >= 3) {
        toast('সঠিক উত্তর দেখো 👇', { icon: '📖' });
      } else {
        toast(res.data.message || 'আবার চেষ্টা করো! 💪', { icon: '🔄' });
      }
    } catch {
      toast.error('সাবমিট করতে সমস্যা হয়েছে');
      setAttempts(currentAttempt - 1); // revert
    }
  };

  const tryAgain = () => {
    setAnswer('');
    setFeedback(null);
    inputRef.current?.focus();
  };

  // Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordingUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch { toast.error('মাইক্রোফোন অ্যাক্সেস দিন'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Keyboard: space to play when not in input
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); playAudio(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [playAudio]);

  if (loading) {
    return (
      <StudentLayout title="Practice">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
        </div>
      </StudentLayout>
    );
  }

  if (items.length === 0) {
    return (
      <StudentLayout title="Practice">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-brand-navy mb-2">অসাধারণ!</h3>
          <p className="text-gray-600 mb-6">
            {mode === 'review' ? 'কোনো রিভিউ বাকি নেই!' : 'এই মুহূর্তে কোনো নতুন আইটেম নেই।'}
          </p>
          <button onClick={fetchItems} className="btn-primary">আবার চেষ্টা করো</button>
        </div>
      </StudentLayout>
    );
  }

  const categoryLabels = { ielts: 'IELTS Spelling', phrase: 'Phrase', sentence: 'Sentence', passage: 'Passage' };
  const diffColors = { easy: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' };

  return (
    <StudentLayout title={`Practice - ${categoryLabels[category] || 'All'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>{currentIndex + 1}/{items.length}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${diffColors[item?.difficulty] || ''}`}>
            {item?.difficulty}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div className="bg-brand-navy h-2 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}></div>
        </div>

        {/* Accent Selector */}
        <div className="card mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-600">Accent:</span>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'british', label: '🇬🇧 British', flag: '🇬🇧' },
                { key: 'american', label: '🇺🇸 American', flag: '🇺🇸' },
                { key: 'australian', label: '🇦🇺 Australian', flag: '🇦🇺' },
                { key: 'newzealand', label: '🇳🇿 NZ', flag: '🇳🇿' },
              ].map(a => (
                <button key={a.key} onClick={() => setAccent(a.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${accent === a.key ? 'bg-brand-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">* ভয়েস আপনার ডিভাইস/ব্রাউজারের উপর নির্ভর করে</p>
        </div>

        {/* Audio Player */}
        <div className="card mb-4 text-center">
          <button onClick={playAudio} disabled={isPlaying}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto transition-all ${isPlaying ? 'bg-brand-navy text-white animate-pulse' : 'bg-navy-50 text-brand-navy hover:bg-navy-100 hover:scale-105'}`}>
            {isPlaying ? '🔊' : '▶️'}
          </button>
          <p className="text-sm text-gray-500 mt-3">{isPlaying ? 'শুনছো...' : 'শোনার জন্য ক্লিক করো (বা Space চাপো)'}</p>
          <p className="text-xs text-gray-400 mt-1">Replays: {replayCount} {item?.replay_limit ? `/ ${item.replay_limit}` : ''}</p>
        </div>

        {/* Answer Input */}
        <form onSubmit={handleSubmit} className="card mb-4">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">তোমার উত্তর লেখো:</label>
              <span className="text-xs text-gray-400">Attempt: {attempts}/3</span>
            </div>
            {item?.category === 'passage' ? (
              <textarea ref={inputRef} value={answer} onChange={(e) => setAnswer(e.target.value)}
                className="input-field text-lg min-h-[100px]" placeholder="Type what you hear..."
                disabled={feedback?.is_correct || attempts >= 3}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
                data-lt-active="false"
                onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handleSubmit(e); }} />
            ) : (
              <input ref={inputRef} type="text" value={answer} onChange={(e) => setAnswer(e.target.value)}
                className="input-field text-lg" placeholder="Type what you hear..."
                disabled={feedback?.is_correct || attempts >= 3}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
                data-lt-active="false"
                autoFocus />
            )}
          </div>

          {/* Attempt Indicators */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i <= attempts ? (feedback?.is_correct && i === attempts ? 'bg-green-500' : 'bg-red-400') : 'bg-gray-200'}`} />
            ))}
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`p-4 rounded-xl mb-4 ${feedback.is_correct ? 'bg-green-50 border border-green-200' : attempts >= 3 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <p className="font-semibold mb-1">{feedback.message}</p>
              {feedback.is_correct && (
                <p className="text-green-700">✅ +{feedback.xp_earned || 0} XP</p>
              )}
              {feedback.correct_text && !feedback.is_correct && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">সঠিক উত্তর:</p>
                  <p className="font-mono bg-white p-2 rounded border text-green-700">{feedback.correct_text}</p>
                </div>
              )}
              {feedback.differences && feedback.differences.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">তুলনা:</p>
                  <div className="flex flex-wrap gap-1 bg-white p-2 rounded border">
                    {feedback.differences.map((d, i) => (
                      <span key={i} className={`px-1.5 py-0.5 rounded text-sm font-mono ${d.status === 'correct' ? 'bg-green-100 text-green-700' : d.status === 'wrong' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {d.status === 'wrong' ? <><s className="text-red-400">{d.studentWord}</s>→{d.word}</> : d.word || '___'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {!feedback?.is_correct && attempts < 3 && (
              <button type="submit" className="btn-primary flex-1" disabled={!answer.trim()}>Submit</button>
            )}
            {feedback && !feedback.is_correct && attempts < 3 && (
              <button type="button" onClick={tryAgain} className="btn-secondary flex-1">আবার চেষ্টা 💪</button>
            )}
            {(feedback?.is_correct || attempts >= 3) && (
              <button type="button" onClick={nextItem} className="btn-primary flex-1">পরবর্তী ➡️</button>
            )}
          </div>
        </form>

        {/* Recording */}
        <div className="card">
          <h4 className="text-sm font-medium text-gray-700 mb-2">🎙️ Shadowing - নিজের উচ্চারণ রেকর্ড করো</h4>
          <p className="text-xs text-gray-400 mb-3">আপনার রেকর্ডিং শুধু practice/shadowing purpose-এ ব্যবহৃত হবে।</p>
          <div className="flex items-center gap-3 flex-wrap">
            {!isRecording ? (
              <button onClick={startRecording} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition">🎙️ Record</button>
            ) : (
              <button onClick={stopRecording} className="btn-danger text-sm py-2 animate-pulse">⏹️ Stop</button>
            )}
            {recordingUrl && (
              <>
                <audio controls src={recordingUrl} className="flex-1 h-10" />
                <button onClick={() => setRecordingUrl(null)} className="text-red-500 text-sm hover:underline">🗑️</button>
              </>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
