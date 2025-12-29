'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { 
  Play, Download, CloudLightning, AlertTriangle, 
  Copy, CheckCircle, Wifi, HardDrive, ExternalLink, 
  Cast, MonitorPlay
} from 'lucide-react';

interface Stream {
  server: string;
  link: string;
  type: string;
}

function NCloudPlayer() {
  const params = useSearchParams();
  const key = params.get('key');
  
  // --- STATE & LOGIC ---
  const [loading, setLoading] = useState(true);
  const [streams, setStreams] = useState<Stream[]>([]); 
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [metaData, setMetaData] = useState<any>(null);
  const [apiTitle, setApiTitle] = useState('');
  
  const [tab, setTab] = useState<'stream' | 'download'>('stream');
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (key) {
      const init = async () => {
        try {
          // Decoding Logic
          const json = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(json);
          setMetaData(payload);

          // API Call
          const res = await fetch(`/api/ncloud?url=${payload.url}`);
          const result = await res.json();
          
          if (result.success && result.streams.length > 0) {
             setStreams(result.streams);
             setCurrentStream(result.streams[0]);
             setApiTitle(result.title);
             setLoading(false);
          } else {
             throw new Error("No streams found");
          }
        } catch (e) {
          console.error("Fetch Error", e);
          setLoading(false);
        }
      };
      init();
    }
  }, [key]);

  // --- HANDLERS ---
  const handleServerClick = (stream: Stream) => {
      setCurrentStream(stream);
      if (tab === 'download') window.open(stream.link, '_blank');
  };

  const copyLink = () => {
    if (currentStream?.link) {
      navigator.clipboard.writeText(currentStream.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const playInApp = (pkg: string) => {
    if (!currentStream?.link) return;
    const intent = `intent:${currentStream.link}#Intent;package=${pkg};type=video/*;scheme=https;end`;
    window.location.href = intent;
  };

  // --- 1. LOADING UI ---
  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="relative z-10 flex flex-col items-center text-center">
         <div className="w-16 h-16 md:w-20 md:h-20 relative mb-6">
            <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-b-4 border-purple-500 rounded-full animate-spin-reverse"></div>
            <CloudLightning className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
         </div>
         <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse">
            Connecting Securely...
         </h2>
      </div>
    </div>
  );

  // --- 2. ERROR UI ---
  if (!currentStream) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-bold text-white mb-2">Stream Unavailable</h3>
        <button onClick={() => window.location.reload()} className="mt-4 w-full py-3 bg-red-600 rounded-xl font-bold text-white">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden relative pb-10">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-[60px]" style={{ backgroundImage: `url(${metaData?.poster || ''})` }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-[#050505]/80"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        
        {/* HEADER: Stacked on Mobile, Row on Desktop */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center backdrop-blur-md shadow-lg">
                    <CloudLightning className="text-blue-400" size={20}/>
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">S-CLOUD</h1>
                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono text-gray-400">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        ENCRYPTED • {currentStream.server}
                    </div>
                </div>
            </div>
            
            {/* Tab Switcher: Full width on mobile */}
            <div className="w-full md:w-auto bg-white/5 border border-white/10 p-1 rounded-xl flex">
                <button 
                    onClick={() => setTab('stream')} 
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${tab === 'stream' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}
                >
                    <Play size={16} /> Stream
                </button>
                <button 
                    onClick={() => setTab('download')} 
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${tab === 'download' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400'}`}
                >
                    <Download size={16} /> Save
                </button>
            </div>
        </header>

        {/* MAIN GRID: 1 Col Mobile, 12 Cols Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
           
           {/* PLAYER SECTION (Top on Mobile) */}
           <div className="lg:col-span-8 space-y-4">
              
              {/* Aspect Ratio Container */}
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                 {tab === 'stream' ? (
                     <video 
                        key={currentStream.link} 
                        controls 
                        autoPlay
                        playsInline 
                        className="w-full h-full object-contain" 
                        poster={metaData?.poster || ''}
                        src={currentStream.link}
                     >
                     </video>
                 ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/40 p-6 text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
                           <Download size={32} className="text-green-400" />
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-white">Download Ready</h3>
                        <p className="text-xs md:text-sm text-gray-400 mt-2">Select a server below to start.</p>
                     </div>
                 )}
              </div>

              {/* Title Info */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm">
                  <h2 className="text-lg md:text-2xl font-bold text-white leading-tight mb-2 line-clamp-2">
                      {metaData?.title || apiTitle || 'Unknown Title'}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] md:text-xs font-bold flex items-center gap-1">
                          <HardDrive size={10}/> HD Source
                      </span>
                      <span className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] md:text-xs font-bold flex items-center gap-1">
                          <Cast size={10}/> Cloud
                      </span>
                  </div>
              </div>
           </div>

           {/* CONTROLS SECTION (Bottom on Mobile) */}
           <div className="lg:col-span-4 space-y-4 md:space-y-6">
              
              {/* Server List: Fixed Height with Scroll */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-xl flex flex-col h-[300px] md:h-[400px]">
                 <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <Wifi size={12} /> {tab === 'download' ? 'Download Servers' : 'Stream Servers'}
                 </h3>
                 
                 <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                    {streams.map((stream, idx) => {
                        const isActive = currentStream.link === stream.link;
                        return (
                            <button 
                                key={idx}
                                onClick={() => handleServerClick(stream)}
                                className={`w-full p-3 rounded-xl flex items-center justify-between transition-all border ${
                                    isActive 
                                    ? (tab === 'download' ? 'bg-green-500/10 border-green-500/50 text-white' : 'bg-blue-600 border-blue-500 text-white') 
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-gray-600'}`}></div>
                                    <div className="text-left">
                                        <p className="font-bold text-xs md:text-sm">{stream.server}</p>
                                        <p className="text-[9px] opacity-60 font-mono uppercase">{stream.type || 'FAST'}</p>
                                    </div>
                                </div>
                                {isActive && <MonitorPlay size={14} />}
                            </button>
                        );
                    })}
                 </div>
              </div>

              {/* Action Buttons: Big Touch Targets */}
              <div className="space-y-3">
                 {tab === 'stream' ? (
                    <>
                       {/* Mobile First: Stacked Buttons */}
                       <button onClick={() => playInApp('org.videolan.vlc')} className="w-full py-3.5 bg-[#ff6b00]/10 border border-[#ff6b00]/20 active:bg-[#ff6b00]/30 rounded-xl flex items-center justify-center gap-2 text-[#ff6b00] font-bold text-sm md:text-base transition-all">
                          Play in VLC
                       </button>
                       <button onClick={() => playInApp('com.mxtech.videoplayer.ad')} className="w-full py-3.5 bg-blue-500/10 border border-blue-500/20 active:bg-blue-500/30 rounded-xl flex items-center justify-center gap-2 text-blue-400 font-bold text-sm md:text-base transition-all">
                          Play in MX Player
                       </button>
                    </>
                 ) : (
                    <button onClick={copyLink} className="w-full py-4 bg-white/5 active:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-white transition-all">
                          {copied ? <CheckCircle size={18} className="text-green-500"/> : <Copy size={18} className="text-gray-400"/>}
                          <span className={copied ? 'text-green-500 font-bold' : 'font-medium'}>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                 )}
              </div>

           </div>
        </div>
      </div>
    </div>
  );
}

export default function NCloud() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white text-sm">Loading App...</div>}>
      <NCloudPlayer />
    </Suspense>
  );
}
