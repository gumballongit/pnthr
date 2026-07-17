import React, { useState, useEffect, useRef } from 'react';
import { User, Voice, AudioHistoryItem } from '../types.ts';
import { fetchVoices, generateSpeech } from '../services/elevenlabs.ts';
import { CREDITS_PER_GENERATION } from '../constants.ts';
import { 
  Play, Download, Loader2, Volume2, Settings2, 
  History, Sparkles, AlertCircle, Search
} from 'lucide-react';

interface DashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onOpenPayment: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser, onOpenPayment }) => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const [history, setHistory] = useState<AudioHistoryItem[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadVoices = async () => {
      setIsLoadingVoices(true);
      const fetchedVoices = await fetchVoices();
      setVoices(fetchedVoices);
      if (fetchedVoices.length > 0) {
        setSelectedVoice(fetchedVoices[0].voice_id);
      }
      setIsLoadingVoices(false);
    };
    loadVoices();

    // Load history from local storage
    const savedHistory = localStorage.getItem(`tts_history_${user.username}`);
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, [user.username]);

  const saveHistory = (newHistory: AudioHistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem(`tts_history_${user.username}`, JSON.stringify(newHistory));
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter some text to generate.');
      return;
    }
    if (!selectedVoice) {
      setError('Please select a voice.');
      return;
    }
    if (!user.isSubscribed && user.credits < CREDITS_PER_GENERATION) {
      setError('Not enough credits. Please upgrade your account.');
      return;
    }

    setError('');
    setIsGenerating(true);

    try {
      const audioBlob = await generateSpeech(text, selectedVoice);
      const url = URL.createObjectURL(audioBlob);
      
      const voiceName = voices.find(v => v.voice_id === selectedVoice)?.name || 'Unknown Voice';
      
      const newItem: AudioHistoryItem = {
        id: Date.now().toString(),
        text,
        voiceName,
        url,
        timestamp: Date.now(),
      };

      saveHistory([newItem, ...history]);
      
      // Deduct credits if not subscribed
      if (!user.isSubscribed) {
        onUpdateUser({
          ...user,
          credits: user.credits - CREDITS_PER_GENERATION
        });
      }
      
      // Auto-play the new generation
      playAudio(newItem.id, url);

    } catch (err: any) {
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = (id: string, url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null);
      return;
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    
    audio.onended = () => setCurrentlyPlaying(null);
    audio.play();
    setCurrentlyPlaying(id);
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredVoices = voices.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.labels && Object.values(v.labels).some(l => l.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Voice Selection Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-indigo-400" />
                Select Voice
              </h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search voices..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-950 border border-gray-800 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {isLoadingVoices ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading voices...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredVoices.map((voice) => (
                  <button
                    key={voice.voice_id}
                    onClick={() => setSelectedVoice(voice.voice_id)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      selectedVoice === voice.voice_id 
                        ? 'bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500' 
                        : 'bg-gray-950 border-gray-800 hover:border-gray-700 hover:bg-gray-800/50'
                    }`}
                  >
                    <span className="font-medium text-gray-200">{voice.name}</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {voice.labels && Object.entries(voice.labels).slice(0, 2).map(([key, val]) => (
                        <span key={key} className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded-md">
                          {val}
                        </span>
                      ))}
                      {!voice.labels && <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded-md">{voice.category}</span>}
                    </div>
                  </button>
                ))}
                {filteredVoices.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No voices found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Text Input Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-400" />
                Text to Speech
              </h2>
              <span className="text-xs text-gray-500 font-mono">
                {text.length} chars
              </span>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type something here to generate speech..."
              className="flex-1 w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all custom-scrollbar"
            />

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Cost: <span className="text-white font-medium">{CREDITS_PER_GENERATION} credit</span>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim() || !selectedVoice}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-medium rounded-xl px-6 py-3 flex items-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Audio
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-sm h-full max-h-[calc(100vh-8rem)] flex flex-col">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-indigo-400" />
              Recent Generations
            </h2>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                  <History className="w-12 h-12 mb-3 opacity-20" />
                  <p>No history yet.</p>
                  <p className="text-sm mt-1">Generate some audio to see it here.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="bg-gray-950 border border-gray-800 rounded-xl p-4 group hover:border-gray-700 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-indigo-400">{item.voiceName}</span>
                      <span className="text-xs text-gray-600">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2 mb-3" title={item.text}>
                      "{item.text}"
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => playAudio(item.id, item.url)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentlyPlaying === item.id 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {currentlyPlaying === item.id ? (
                          <>Stop</>
                        ) : (
                          <><Play className="w-4 h-4" /> Play</>
                        )}
                      </button>
                      <button
                        onClick={() => handleDownload(item.url, item.voiceName)}
                        className="p-2 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
                        title="Download MP3"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #374151;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #4B5563;
        }
      `}} />
    </div>
  );
};
