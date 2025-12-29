'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { 
  Play, Download, CloudLightning, Loader2, AlertTriangle, 
  Copy, CheckCircle, Server, HardDrive, ExternalLink, 
  Cast, MonitorPlay, Wifi
} from 'lucide-react';

interface Stream {
  server: string;
  link: string;
  type: string;
}

function NCloudPlayer() {
  const params = useSearchParams();
  const key = params.get('key');
  
  // --- SAME LOGIC (NO CHANGES) ---
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
          const json = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(json);
          setMetaData(payload);

          const res = await fetch(`/api/ncloud?url=${payload.url}`);
          const result = await res.json();
          
          if (result.success && result.streams.length > 0) {
             setStreams(result.streams);
             setCurrentStream(result.streams[0]);
             setApiTitle(result.title);
             setLoading(false);
          } else {
             throw new Error("No playable streams found");
          }
        } catch (e) {
          console.error("Stream Fetch Error", e);
          setLoading(false);
        }
      };
      init();
    }
  }, [key]);

  const handleServerClick = (stream: Stream) => {
      setCurrentStream(stream);
      if (tab === 'download') {
          window.open(stream.link, '_blank');
      }
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

  // --- NEW PREMIUM UI ---

  // 1. Loading Screen with Animation
  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-600/5 blur-[100px] animate-pulse"></div>
      <div className="relative z-10 flex flex-col items-center">
         <div className="w-20 h-20 relative mb-6">
            <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-b-4 border-purple-500 rounded-full animate-spin-reverse"></div>
            <CloudLightning className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
         </div>
         <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse">
            Establishing Secure Connection...
         </h2>
         <p className="text-gray-500 text-sm mt-2 font-mono">Resolving High-Speed Streams</p>
      </div>
    </div>
  );

  // 2. Error Screen
  if (!currentStream) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-red-500">
      <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-white mb-2">Stream Offline</h3>
        <p className="text-gray-400 mb-6">We couldn't reach the cloud servers.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-all hover:scale-105">Retry Connection</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden relative">
      
      {/* Dynamic Background Blur */}
      <div className="fixed inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-[80px] scale-110 transition-all duration-1000"
            style={{ backgroundImage: `url(${metaData?.poster || ''})` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-[#050505]/60"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 animate-fade-in-down">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-2xl shadow-blue-500/10">
                    <CloudLightning className="text-blue-400" size={24}/>
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white">N-CLOUD <span className="text-blue-500">PREMIUM</span></h1>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mt-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                        SECURE • ENCRYPTED • {currentStream.server}
                    </div>
                </div>
            </div>
            
            {/* Tab Switcher (Glassy) */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl flex shadow-xl">
                <button 
                    onClick={() => setTab('stream')} 
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${tab === 'stream' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-gray-400 hover:text-white'}`}
                >
                    <Play size={16} className={tab === 'stream' ? 'fill-current' : ''} /> Stream
                </button>
                <button 
                    onClick={() => setTab('download')} 
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${tab === 'download' ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/25' : 'text-gray-400 hover:text-white'}`}
                >
                    <Download size={16} /> Download
                </button>
            </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
           
           {/* LEFT: PLAYER AREA (8 Cols) */}
           <div className="lg:col-span-8 space-y-6 animate-fade-in-up">
              
              {/* Player Container */}
              <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_-10px_rgba(59,130,246,0.15)] group">
                 {tab === 'stream' ? (
                     <video 
                        key={currentStream.link} 
                        controls 
                        autoPlay
                        className="w-full h-full object-contain" 
                        poster={metaData?.poster || ''}
                        src={currentStream.link}
                     >
                     </video>
                 ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <div className="relative z-10 p-8 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 text-center transform group-hover:scale-105 transition-transform duration-500">
                             <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                <Download size={40} className="text-green-400 animate-bounce" />
                             </div>
                             <h3 className="text-2xl font-bold text-white mb-2">Ready to Download</h3>
                             <p className="text-gray-400 max-w-sm mx-auto">
                                Select a server from the list to begin your high-speed secure download.
                             </p>
                        </div>
                     </div>
                 )}
              </div>

              {/* Movie Info */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                  <h2 className="text-2xl font-bold text-white leading-tight mb-2">
                      {metaData?.title || apiTitle || 'Unknown Title'}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                      <span className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center gap-2">
                          <HardDrive size={12}/> {apiTitle || 'HD Source'}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold flex items-center gap-2">
                          <Cast size={12}/> Cloud Stream
                      </span>
                  </div>
              </div>
           </div>

           {/* RIGHT: CONTROLS & SERVERS (4 Cols) */}
           <div className="lg:col-span-4 space-y-6 animate-fade-in-up delay-100">
              
              {/* Server List */}
              <div className="bg-black/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col h-[400px]">
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Wifi size={14} /> Available Servers
                 </h3>
                 
                 <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                    {streams.map((stream, idx) => {
                        const isActive = currentStream.link === stream.link;
                        return (
                            <button 
                                key={idx}
                                onClick={() => handleServerClick(stream)}
                                className={`w-full p-4 rounded-xl flex items-center justify-between transition-all duration-300 border relative overflow-hidden group/btn ${
                                    isActive 
                                    ? (tab === 'download' ? 'bg-green-500/10 border-green-500/50 text-white shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]') 
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20'
                                }`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-3 h-3 rounded-full shadow-lg ${isActive ? 'bg-white animate-pulse' : 'bg-gray-600'}`}></div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm">{stream.server}</p>
                                        <p className="text-[10px] opacity-60 font-mono">{stream.type || 'HLS'}</p>
                                    </div>
                                </div>
                                
                                {tab === 'download' ? (
                                    <ExternalLink size={16} className={`relative z-10 ${isActive ? 'text-green-300' : 'text-gray-600 group-hover/btn:text-white'}`} />
                                ) : (
                                    isActive && <MonitorPlay size={16} className="relative z-10 text-blue-200" />
                                )}
                            </button>
                        );
                    })}
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                 {tab === 'stream' ? (
                    <>
                       <button onClick={() => playInApp('org.videolan.vlc')} className="w-full py-3.5 bg-[#ff6b00]/10 border border-[#ff6b00]/20 hover:bg-[#ff6b00] hover:text-black hover:border-[#ff6b00] rounded-xl flex items-center justify-center gap-3 text-[#ff6b00] font-bold transition-all duration-300 group">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e6/VLC_Icon.svg" className="w-5 h-5 drop-shadow-md" alt="VLC" />
                          Play in VLC Player
                       </button>
                       <button onClick={() => playInApp('com.mxtech.videoplayer.ad')} className="w-full py-3.5 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-xl flex items-center justify-center gap-3 text-blue-400 font-bold transition-all duration-300">
                          <Play size={18} className="fill-current"/> Play in MX Player
                       </button>
                    </>
                 ) : (
                    <button onClick={copyLink} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl flex items-center justify-center gap-3 text-white transition-all duration-300 group">
                          {copied ? <CheckCircle size={20} className="text-green-500"/> : <Copy size={20} className="text-gray-400 group-hover:text-white"/>}
                          <span className={copied ? 'text-green-500 font-bold' : 'font-medium'}>{copied ? 'Link Copied!' : 'Copy Direct Link'}</span>
                    </button>
                 )}
              </div>

           </div>
        </div>
      </div>
      
      {/* CSS Animations (Inline for simplicity) */}
      <style jsx global>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.6s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-spin-reverse { animation: spin 1.5s linear infinite reverse; }
      `}</style>
    </div>
  );
}

export default function NCloud() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Initializing N-Cloud...</div>}>
      <NCloudPlayer />
    </Suspense>
  );
}
