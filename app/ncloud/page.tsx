// app/ncloud/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { 
  Play, Download, CloudLightning, Loader2, AlertTriangle, 
  Copy, CheckCircle, Server, HardDrive, Smartphone, Zap
} from 'lucide-react';

// --- Types ---
interface Stream {
  server: string;
  link: string;
  type: string;
}

function NCloudPlayer() {
  const params = useSearchParams();
  const key = params.get('key');
  
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
          // 1. Decode Data
          const json = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(json);
          setMetaData(payload);

          // 2. Fetch Streams (Backend API Call)
          // Ensure your /api/ncloud route is implementing the filtering logic we discussed
          const res = await fetch(`/api/ncloud?url=${payload.url}`);
          const result = await res.json();
          
          if (result.success && result.streams.length > 0) {
             setStreams(result.streams);
             setCurrentStream(result.streams[0]); // Auto-select best server
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

  const changeServer = (stream: Stream) => {
      setCurrentStream(stream);
  };

  const copyLink = () => {
    if (currentStream?.link) {
      navigator.clipboard.writeText(currentStream.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- External App Intents (Android) ---
  const playInVLC = () => {
    if (!currentStream?.link) return;
    const intent = `intent:${currentStream.link}#Intent;package=org.videolan.vlc;type=video/*;scheme=https;end`;
    window.location.href = intent;
  };

  const playInMX = () => {
    if (!currentStream?.link) return;
    const intent = `intent:${currentStream.link}#Intent;package=com.mxtech.videoplayer.ad;type=video/*;scheme=https;end`;
    window.location.href = intent;
  };

  const downloadIn1DM = () => {
    if (!currentStream?.link) return;
    const intent = `intent:${currentStream.link}#Intent;package=idm.internet.download.manager;type=video/*;scheme=https;end`;
    window.location.href = intent;
  };
  
  const downloadInADM = () => {
    if (!currentStream?.link) return;
    const intent = `intent:${currentStream.link}#Intent;package=com.dv.adm;type=video/*;scheme=https;end`;
    window.location.href = intent;
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <div className="relative mb-4">
         <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500"></div>
         <CloudLightning className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400" size={24}/>
      </div>
      <p className="text-gray-400 font-mono text-sm">Resolving Best Servers...</p>
    </div>
  );

  if (!currentStream) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-red-500">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
        <p>No Streams Available</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-gray-800 rounded text-white text-sm">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <CloudLightning className="text-white" size={20}/>
            </div>
            <div>
                <h1 className="text-xl font-bold">N-Cloud Player</h1>
                <p className="text-xs text-blue-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Active Server: <span className="text-white font-bold">{currentStream.server}</span>
                </p>
            </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
           
           {/* LEFT COLUMN: PLAYER */}
           <div className="lg:col-span-2 space-y-4">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl group">
                 <video 
                    key={currentStream.link} // Forces reload on server switch
                    controls 
                    autoPlay
                    className="w-full h-full" 
                    poster={metaData?.poster || ''}
                    src={currentStream.link}
                 >
                 </video>
              </div>
              <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
                      {metaData?.title || apiTitle || 'Unknown Title'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1 break-all font-mono bg-gray-900/50 p-2 rounded border border-gray-800">
                      <HardDrive size={12} className="inline mr-2"/>
                      {apiTitle || 'File details unavailable'}
                  </p>
              </div>
           </div>

           {/* RIGHT COLUMN: SERVERS & ACTIONS */}
           <div className="lg:col-span-1 space-y-4">
              
              {/* SERVER SELECTOR */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <Server size={14} /> Available Servers
                 </h3>
                 <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700">
                    {streams.map((stream, idx) => (
                        <button 
                            key={idx}
                            onClick={() => changeServer(stream)}
                            className={`w-full py-3 px-4 rounded-xl flex items-center justify-between transition-all border ${
                                currentStream.link === stream.link 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${currentStream.link === stream.link ? 'bg-white animate-pulse' : 'bg-gray-500'}`}></div>
                                <span className="font-semibold text-sm">{stream.server}</span>
                            </div>
                            {idx === 0 && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-bold">BEST</span>}
                        </button>
                    ))}
                 </div>
              </div>

              {/* ACTIONS CARD */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                 <div className="flex p-1 bg-black/40 rounded-lg mb-5">
                    <button onClick={() => setTab('stream')} className={`flex-1 py-2 text-sm font-bold rounded transition-all ${tab === 'stream' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Stream</button>
                    <button onClick={() => setTab('download')} className={`flex-1 py-2 text-sm font-bold rounded transition-all ${tab === 'download' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Download</button>
                 </div>

                 {tab === 'stream' ? (
                    <div className="space-y-3 animate-fade-in">
                       <button onClick={playInVLC} className="w-full py-3 bg-[#ff6b00]/10 border border-[#ff6b00]/30 hover:bg-[#ff6b00]/20 rounded-xl flex items-center justify-center gap-2 text-[#ff6b00] font-bold transition-all group">
                          <div className="w-8 h-8 rounded bg-[#ff6b00] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                             <Play size={16} className="fill-current"/> 
                          </div>
                          Play in VLC
                       </button>
                       <button onClick={playInMX} className="w-full py-3 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 rounded-xl flex items-center justify-center gap-2 text-blue-400 font-bold transition-all group">
                          <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                             <Play size={16} className="fill-current"/> 
                          </div>
                          Play in MX Player
                       </button>
                    </div>
                 ) : (
                    <div className="space-y-4 animate-fade-in">
                       {/* App Downloads (No Lag) */}
                       <div className="grid grid-cols-2 gap-3">
                           <button onClick={downloadIn1DM} className="py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl flex flex-col items-center justify-center gap-1 transition-all">
                               <Smartphone size={20} className="text-blue-400"/>
                               <span className="text-xs font-bold text-white">1DM App</span>
                           </button>
                           <button onClick={downloadInADM} className="py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl flex flex-col items-center justify-center gap-1 transition-all">
                               <Smartphone size={20} className="text-green-400"/>
                               <span className="text-xs font-bold text-white">ADM App</span>
                           </button>
                       </div>

                       {/* Direct Browser Download (Safe Mode) */}
                       <a 
                          href={currentStream.link} 
                          download
                          target="_blank" // Key for No Lag
                          rel="noopener noreferrer"
                          className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl flex items-center justify-center gap-2 text-white font-bold transition-all shadow-lg shadow-green-900/20"
                       >
                          <Download size={18}/> Direct Browser DL
                       </a>

                       <button onClick={copyLink} className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center gap-2 text-gray-300 transition-all border border-gray-700">
                          {copied ? <CheckCircle size={18} className="text-green-500"/> : <Copy size={18}/>}
                          {copied ? 'Copied' : 'Copy Link'}
                       </button>
                    </div>
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
    <Suspense fallback={<div className="text-white text-center mt-20">Loading Player...</div>}>
      <NCloudPlayer />
    </Suspense>
  );
}
