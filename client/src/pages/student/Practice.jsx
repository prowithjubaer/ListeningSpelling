import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import StudentLayout from '../../components/StudentLayout';
import api from '../../utils/api';

export default function Practice() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'new';

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [accent, setAccent] = useState('british');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [completed, setCompleted] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchNextItem();
  }, [category, mode]);

  const fetchNextItem = () => {
    setLoading(true);
    setAnswer('');
    setAttempts(0);
    setFeedback(null);
    setCompleted(false);
    setRecordingUrl(null);

    const params = { mode };
    if (category) params.category = category;

    api.get('/student/practice', { params })
      .then(res => {
        setItem(res.data);
        setLoading(false);
      })
      .catch(err => {
        if (err.response?.status === 404) {
          setItem(null);
          setCompleted(true);
        } else {
          toast.error('আইটেম লোড করতে সমস্যা হয়েছে');
        }
        setLoading(false);
      });
  };

  const playAudio = async () => {
    if (!item) return;
    setIsPlaying(true);

    try {
      // Try uploaded audio first
      const ttsRes = await api.get(`/student/practice/${item.id}/tts`, {
        params: { accent },
        responseType: 'blob'
      });

      if (ttsRes.data.size > 0) {
        const audioUrl = URL.createObjectURL(ttsRes.data);
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          fallbackTTS();
        };
        audio.play();
        return;
      }
    } catch {
      // Fall back to browser TTS
    }

    fallbackTTS();
  };

  const fallbackTTS = () => {
    if (!item?.correct_text) {
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(item.correct_text);

    if (accent === 'british') {
      utterance.lang = 'en-GB';
    } else if (accent === 'australian') {
      utterance.lang = 'en-AU';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.rate = 0.9;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim() || !item) return;

    const currentAttempt = attempts + 1;
    setAttempts(currentAttempt);

    try {
      const res = await api.post(`/student/practice/${item.id}/submit`, {
        answer: answer.trim(),
        attempt: currentAttempt,
      });

      setFeedback(res.data);

      if (res.data.correct) {
        toast.success('সঠিক উত্তর! 🎉');
      } else if (currentAttempt >= 3) {
        toast.error('সঠিক উত্তর দেখে নাও');
      } else {
        toast('আবার চেষ্টা করো! 💪', { icon: '🔄' });
      }
    } catch {
      toast.error('সাবমিট করতে সমস্যা হয়েছে');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordingUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast('রেকর্ডিং শুরু হয়েছে... 🎙️');
    } catch {
      toast.error('মাইক্রোফোন অ্যাক্সেস দিন');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const getAttemptColor = () => {
    if (attempts === 0) return 'border-gray-200';
    if (feedback?.correct) return 'border-green-500 bg-green-50';
    if (attempts >= 3) return 'border-red-500 bg-red-50';
    return 'border-yellow-500 bg-yellow-50';
  };

  if (loading) {
    return (
      <StudentLayout title="Practice">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy"></div>
        </div>
      </StudentLayout>
    );
  }

  if (completed || !item) {
    return (
      <StudentLayout title="Practice">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-brand-navy mb-2">অসাধারণ!</h3>
          <p className="text-gray-600 mb-6">এই মুহূর্তে কোনো নতুন আইটেম নেই। পরে আবার চেষ্টা করো!</p>
          <button onClick={fetchNextItem} className="btn-primary">আবার চেষ্টা করো</button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title={`Practice - ${category || 'All'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Accent Selector */}
        <div className="card mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-600">Accent:</span>
            <div className="flex gap-2">
              {['british', 'australian', 'teacher'].map(a => (
                <button
                  key={a}
                  onClick={() => setAccent(a)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    accent === a
                      ? 'bg-brand-navy text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {a === 'british' ? '🇬🇧 British' : a === 'australian' ? '🇦🇺 Australian' : '👨‍🏫 Teacher'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audio Player */}
        <div className="card mb-4 text-center">
          <button
            onClick={playAudio}
            disabled={isPlaying}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto transition-all ${
              isPlaying
                ? 'bg-brand-navy text-white animate-pulse'
                : 'bg-navy-50 text-brand-navy hover:bg-navy-100 hover:scale-105'
            }`}
          >
            {isPlaying ? '🔊' : '▶️'}
          </button>
          <p className="text-sm text-gray-500 mt-3">
            {isPlaying ? 'শুনছো...' : 'শোনার জন্য ক্লিক করো'}
          </p>
          {item.note && (
            <p className="text-xs text-gray-400 mt-1 italic">Hint: {item.note}</p>
          )}
        </div>

        {/* Answer Input */}
        <form onSubmit={handleSubmit} className="card mb-4">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">তোমার উত্তর লেখো:</label>
              <span className="text-xs text-gray-400">Attempt: {attempts}/3</span>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className={`input-field text-lg ${getAttemptColor()}`}
              placeholder="Type what you hear..."
              disabled={feedback?.correct || attempts >= 3}
              autoFocus
            />
          </div>

          {/* Attempt Indicators */}
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i <= attempts
                    ? feedback?.correct && i === attempts
                      ? 'bg-green-500'
                      : 'bg-red-400'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`p-4 rounded-xl mb-4 ${feedback.correct ? 'bg-green-50 border border-green-200' : attempts >= 3 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              {feedback.correct ? (
                <div>
                  <p className="font-semibold text-green-700">✅ সঠিক! +{feedback.xp_earned || 0} XP</p>
                </div>
              ) : attempts >= 3 ? (
                <div>
                  <p className="font-semibold text-red-700 mb-1">❌ সঠিক উত্তর:</p>
                  <p className="text-red-900 font-mono bg-white p-2 rounded">{feedback.correct_answer || item.correct_text}</p>
                </div>
              ) : (
                <p className="text-yellow-700 font-medium">🔄 আবার চেষ্টা করো! {feedback.hint || ''}</p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {!feedback?.correct && attempts < 3 && (
              <button type="submit" className="btn-primary flex-1" disabled={!answer.trim()}>
                Submit
              </button>
            )}
            {(feedback?.correct || attempts >= 3) && (
              <button type="button" onClick={fetchNextItem} className="btn-primary flex-1">
                পরবর্তী ➡️
              </button>
            )}
          </div>
        </form>

        {/* Recording Feature */}
        <div className="card">
          <h4 className="text-sm font-medium text-gray-700 mb-3">🎙️ নিজের উচ্চারণ রেকর্ড করো:</h4>
          <div className="flex items-center gap-3">
            {!isRecording ? (
              <button onClick={startRecording} className="btn-secondary text-sm">
                🎙️ Record
              </button>
            ) : (
              <button onClick={stopRecording} className="btn-danger text-sm animate-pulse">
                ⏹️ Stop
              </button>
            )}
            {recordingUrl && (
              <audio controls src={recordingUrl} className="flex-1 h-10" />
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
