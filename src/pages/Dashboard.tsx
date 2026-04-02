import React, { useState, useEffect, useRef } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { detectVerseFromSpeech } from '../services/ai';
import { 
  Mic, MicOff, MonitorPlay, LogOut, BookOpen, Settings, 
  LayoutDashboard, Menu, X, Home, FolderOpen, Calendar, 
  Layers, Sparkles, Play, Square, Type, Image as ImageIcon,
  Clock, Users, Globe, Sliders
} from 'lucide-react';

interface DashboardProps {
  user: User;
}

type Tab = 'home' | 'live' | 'library' | 'scheduler' | 'settings';

export default function Dashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('live');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  
  // Live Control State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState({ 
    type: 'blank', 
    content: '', 
    reference: '', 
    background: 'bg-black',
    animation: 'fade'
  });
  
  const recognitionRef = useRef<any>(null);
  const transcriptBuffer = useRef('');

  useEffect(() => {
    const updateLiveState = async () => {
      // Only attempt to write if user is likely an admin/pastor to prevent permission errors
      if (user.email !== 'methaneex@gmail.com') return;
      
      try {
        await setDoc(doc(db, 'live_state', 'current'), currentSlide);
      } catch (error) {
        console.error('Error updating live state:', error);
      }
    };
    updateLiveState();
  }, [currentSlide, user.email]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = async (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setTranscript(finalTranscript + interimTranscript);

      if (finalTranscript) {
        transcriptBuffer.current += ' ' + finalTranscript;
        
        if (transcriptBuffer.current.split(' ').length > 12) {
          const textToAnalyze = transcriptBuffer.current;
          transcriptBuffer.current = ''; 
          
          const aiResult = await detectVerseFromSpeech(textToAnalyze);
          if (aiResult) {
            setAiAnalysis(aiResult);
            if (aiResult.detected && aiResult.reference && aiResult.text) {
              setCurrentSlide({
                type: 'verse',
                content: aiResult.text,
                reference: aiResult.reference,
                background: aiResult.suggestedBackground || 'bg-gradient-to-br from-gray-900 to-blue-900',
                animation: aiResult.suggestedAnimation || 'fade'
              });
            }
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) recognition.start();
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const handleManualUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    setCurrentSlide({
      type: formData.get('type') as string,
      content: formData.get('content') as string,
      reference: formData.get('reference') as string,
      background: formData.get('background') as string || 'bg-black',
      animation: formData.get('animation') as string || 'fade'
    });
  };

  const openLiveDisplay = () => {
    window.open('/live', '_blank', 'width=1280,height=720');
  };

  // --- Render Functions for Tabs ---

  const renderHome = () => (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user.displayName?.split(' ')[0] || 'User'}</h2>
          <p className="text-gray-500 mt-2">Here's what's happening with your services today.</p>
        </div>
        <button onClick={() => setActiveTab('live')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all">
          <Play className="w-5 h-5 fill-current" /> Start Live Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <Calendar className="w-6 h-6" />
            <h3 className="font-semibold text-gray-900">Upcoming Service</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">Sunday Worship</p>
          <p className="text-gray-500 text-sm mb-4">Tomorrow at 10:00 AM</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Sermon:</span><span className="font-medium">The Book of John</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Songs:</span><span className="font-medium">4 selected</span></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-sm text-white col-span-1 md:col-span-2 relative overflow-hidden">
          <Sparkles className="absolute top-4 right-4 w-24 h-24 text-white/10" />
          <h3 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="w-5 h-5" /> AI Insights (S.M.A.R.T.)</h3>
          <p className="text-indigo-100 mb-4 max-w-md">Based on your upcoming sermon notes, VAIL suggests preparing visuals for themes of <strong>"Grace"</strong> and <strong>"Renewal"</strong>.</p>
          <div className="flex gap-3">
            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors">View Suggested Verses</button>
            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors">Generate Backgrounds</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLiveControl = () => (
    <div className="flex-1 flex flex-col lg:flex-row h-full bg-gray-950 text-gray-300">
      {/* Left Panel: Layers & Scenes (OBS Vibe) */}
      <div className="w-full lg:w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <h3 className="font-semibold text-white flex items-center gap-2"><Layers className="w-4 h-4" /> Layers</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <button onClick={() => setCurrentSlide({ ...currentSlide, type: 'blank', content: '' })} className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 ${currentSlide.type === 'blank' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}>
            <Square className="w-4 h-4" /> Blank Screen
          </button>
          <button onClick={() => setCurrentSlide({ ...currentSlide, type: 'verse' })} className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 ${currentSlide.type === 'verse' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}>
            <BookOpen className="w-4 h-4" /> Bible Verse
          </button>
          <button onClick={() => setCurrentSlide({ ...currentSlide, type: 'lyric' })} className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 ${currentSlide.type === 'lyric' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}>
            <Type className="w-4 h-4" /> Lyrics
          </button>
          <button onClick={() => setCurrentSlide({ ...currentSlide, type: 'media' })} className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 ${currentSlide.type === 'media' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}>
            <ImageIcon className="w-4 h-4" /> Media / Background
          </button>
        </div>
      </div>

      {/* Center Panel: Preview & Manual Control */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Preview Area */}
        <div className="flex-1 p-4 lg:p-8 flex flex-col items-center justify-center bg-black relative">
          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full"></div> LIVE
          </div>
          
          <div className={`w-full max-w-4xl aspect-video rounded-lg shadow-2xl border border-gray-800 overflow-hidden relative flex flex-col items-center justify-center p-8 text-center ${currentSlide.background}`}>
            {currentSlide.type === 'blank' ? (
              <div className="text-gray-500/50">Display is blank</div>
            ) : (
              <>
                <div className="text-white font-serif text-2xl md:text-4xl leading-relaxed mb-4 drop-shadow-lg">
                  "{currentSlide.content || 'Content goes here...'}"
                </div>
                {currentSlide.reference && (
                  <div className="text-white/80 font-sans text-sm md:text-lg font-medium tracking-widest uppercase drop-shadow">
                    {currentSlide.reference}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Manual Override Form (Bottom Dock) */}
        <div className="h-64 bg-gray-900 border-t border-gray-800 p-4 overflow-y-auto">
          <form onSubmit={handleManualUpdate} className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Reference / Title</label>
                  <input type="text" name="reference" defaultValue={currentSlide.reference} className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Type</label>
                  <select name="type" defaultValue={currentSlide.type} className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none">
                    <option value="verse">Bible Verse</option>
                    <option value="lyric">Song Lyric</option>
                    <option value="note">Sermon Note</option>
                    <option value="blank">Blank Screen</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Content</label>
                <textarea name="content" defaultValue={currentSlide.content} rows={2} className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"></textarea>
              </div>
            </div>
            <div className="md:col-span-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Background Theme</label>
                <select name="background" defaultValue={currentSlide.background} className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none">
                  <option value="bg-black">Solid Black</option>
                  <option value="bg-gradient-to-br from-gray-900 to-blue-900">Blue Gradient</option>
                  <option value="bg-gradient-to-br from-gray-900 to-purple-900">Purple Gradient</option>
                  <option value="bg-gradient-to-br from-emerald-900 to-teal-900">Nature Gradient</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Animation</label>
                <select name="animation" defaultValue={currentSlide.animation} className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:border-blue-500 outline-none">
                  <option value="fade">Fade</option>
                  <option value="slide-up">Slide Up</option>
                  <option value="zoom-in">Zoom In</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 transition-colors">
                Push to Display
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Panel: AI Assistant */}
      <div className="w-full lg:w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h3 className="font-semibold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-400" /> V.A.I.L. Engine</h3>
          <button 
            onClick={toggleListening}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${isListening ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            {isListening ? <><MicOff className="w-3 h-3" /> Stop</> : <><Mic className="w-3 h-3" /> Listen</>}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-gray-950 rounded border border-gray-800 p-3">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Live Transcript</h4>
            <div className="font-mono text-xs text-gray-400 h-24 overflow-y-auto">
              {transcript || "Waiting for speech..."}
            </div>
          </div>

          {aiAnalysis && (
            <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3 space-y-3">
              <h4 className="text-xs font-medium text-purple-400 uppercase tracking-wider">AI Analysis</h4>
              
              <div>
                <div className="text-xs text-gray-500">Detected Mood</div>
                <div className="text-sm text-white capitalize">{aiAnalysis.mood || 'Neutral'}</div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500">Context</div>
                <div className="text-sm text-white">{aiAnalysis.context || 'General Worship'}</div>
              </div>

              {aiAnalysis.detected && (
                <div className="bg-purple-500/20 rounded p-2 mt-2">
                  <div className="text-xs text-purple-300 font-medium mb-1">Auto-Pushed Verse</div>
                  <div className="text-sm text-white font-medium">{aiAnalysis.reference}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Media Library</h2>
      <div className="flex gap-4 mb-8">
        <input type="text" placeholder="Search media, templates, backgrounds..." className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200">Filter</button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">Upload</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="group cursor-pointer">
            <div className="aspect-video bg-gray-200 rounded-xl mb-2 overflow-hidden relative">
              <img src={`https://picsum.photos/seed/church${i}/400/225`} alt="Media" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900">Background {i}</p>
            <p className="text-xs text-gray-500">Video Loop • 1080p</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderScheduler = () => (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Service Planner</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Auto-Suggest Order
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Sunday Morning Service</h3>
          <span className="text-sm text-gray-500">Oct 24, 2026</span>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { time: '10:00 AM', title: 'Countdown Video', type: 'Media' },
            { time: '10:05 AM', title: 'Welcome & Announcements', type: 'Notes' },
            { time: '10:10 AM', title: 'Amazing Grace', type: 'Lyrics' },
            { time: '10:15 AM', title: 'How Great Is Our God', type: 'Lyrics' },
            { time: '10:30 AM', title: 'Sermon: The Light', type: 'Verses' },
          ].map((item, i) => (
            <div key={i} className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-move">
              <div className="text-gray-400"><Menu className="w-5 h-5" /></div>
              <div className="w-20 text-sm text-gray-500 font-medium">{item.time}</div>
              <div className="flex-1 font-medium text-gray-900">{item.title}</div>
              <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{item.type}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
      
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-800">AI Settings (S.M.A.R.T.)</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Auto-Suggest Verses</p>
                <p className="text-sm text-gray-500">Automatically push detected verses to live display.</p>
              </div>
              <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Mood-based Visuals</p>
                <p className="text-sm text-gray-500">AI adjusts background visuals based on sermon tone.</p>
              </div>
              <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-800">Language & Translation</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Bible Version</label>
              <select className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                <option>NIV (New International Version)</option>
                <option>ESV (English Standard Version)</option>
                <option>KJV (King James Version)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Main Layout ---

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (H.L.L.S.S Navigation) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold tracking-tight">VAIL</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'home' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Home className="w-5 h-5" /> Home
          </button>
          <button onClick={() => setActiveTab('live')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'live' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <MonitorPlay className="w-5 h-5" /> Live Control
          </button>
          <button onClick={() => setActiveTab('library')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'library' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <FolderOpen className="w-5 h-5" /> Library
          </button>
          <button onClick={() => setActiveTab('scheduler')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'scheduler' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Calendar className="w-5 h-5" /> Scheduler
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Settings className="w-5 h-5" /> Settings
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} alt="Profile" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.displayName || user.email}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{user.email}</p>
            </div>
          </div>
          <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        {/* Top Header (Only show if not in Live Control, or show a minimal one) */}
        {activeTab !== 'live' && (
          <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-600 hover:text-gray-900 focus:outline-none lg:hidden">
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800 capitalize">{activeTab}</h1>
            </div>
            <button onClick={openLiveDisplay} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors">
              <MonitorPlay className="w-5 h-5" />
              <span className="hidden sm:inline">Open Display</span>
            </button>
          </header>
        )}

        {/* Live Control Header (Dark Mode) */}
        {activeTab === 'live' && (
          <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex justify-between items-center shrink-0 text-white">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white focus:outline-none lg:hidden">
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div> Live Control
              </h1>
            </div>
            <button onClick={openLiveDisplay} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
              <MonitorPlay className="w-4 h-4" />
              <span className="hidden sm:inline">Projector</span>
            </button>
          </header>
        )}

        {/* Tab Content */}
        <main className={`flex-1 overflow-y-auto ${activeTab === 'live' ? 'bg-gray-950' : 'bg-gray-50'}`}>
          {activeTab === 'home' && renderHome()}
          {activeTab === 'live' && renderLiveControl()}
          {activeTab === 'library' && renderLibrary()}
          {activeTab === 'scheduler' && renderScheduler()}
          {activeTab === 'settings' && renderSettings()}
        </main>
      </div>
    </div>
  );
}
