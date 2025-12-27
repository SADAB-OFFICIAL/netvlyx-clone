// app/ncloud/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { 
  Play, Download, CloudLightning, Loader2, AlertTriangle, 
  Copy, CheckCircle, Server, HardDrive, ExternalLink
} from 'lucide-react';

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
          const json = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(json);
          setMetaData(payload);

          // Fetch Streams from Backend
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

  // --- Main Logic: Click Handling ---
  const handleServerClick = (stream: Stream) => {
      // 1. Update active stream for UI highlighting
      setCurrentStream(stream);

      // 2. Logic based on Tab
      if (tab === 'download') {
          // DOWNLOAD MODE: Open Link Directly (Browser Popup)
          window.open(stream.link, '_blank');
      } else {
          // STREAM MODE: Just update player (Automatic via state)
      }
  };

  const copyLink = () => {
    if (currentStream?.link) {
      navigator.clipboard.writeText(currentStream.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // External Players (VLC/MX) for Stream Tab
  const playInApp = (pkg: string) => {
    if (!currentStream?.link) return;
    const intent = `intent:${currentStream.link}#Intent;package=${pkg};type=video/*;scheme=https;end`;
    window.location.href = intent;
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <div className="relative mb-4">
         <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500"></div>
         <CloudLightning className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400" size={24}/>
      </div>
      <p className="text-gray-400 font-mono text-sm">Connecting to Cloud...</p>
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
                <h1 className="text-xl font-bold">N-Cloud</h1>
                <p className="text-xs text-blue-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Connected: <span className="text-white font-bold">{currentStream.server}</span>
                </p>
            </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
           
           {/* LEFT COLUMN: PLAYER / INFO */}
           <div className="lg:col-span-2 space-y-4">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl group">
                 {/* Only render video if in Stream tab, saves data/resources in Download tab */}
                 {tab === 'stream' ? (
                     <video 
                        key={currentStream.link} 
                        controls 
                        autoPlay
                        className="w-full h-full" 
                        poster={metaData?.poster || ''}
                        src={currentStream.link}
                     >
                     </video>
                 ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/50">
                        <Download size={48} className="text-green-500 mb-4 animate-bounce" />
                        <h3 className="text-xl font-bold text-white">Download Mode</h3>
                        <p className="text-gray-400 text-sm mt-2">Click any server button to start download</p>
                     </div>
                 )}
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

           {/* RIGHT COLUMN: ACTIONS & SERVERS */}
           <div className="lg:col-span-1 space-y-4">
              
              {/* TABS */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-2">
                 <div className="flex p-1 bg-black/40 rounded-xl">
                    <button 
                        onClick={() => setTab('stream')} 
                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tab === 'stream' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Play size={16} /> Stream
                    </button>
                    <button 
                        onClick={() => setTab('download')} 
                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tab === 'download' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Download size={16} /> Download
                    </button>
                 </div>
              </div>

              {/* SERVER LIST (BEHAVIOR CHANGES BASED ON TAB) */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <Server size={14} /> {tab === 'download' ? 'Select Server to Download' : 'Switch Server'}
                 </h3>
                 <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700">
                    {streams.map((stream, idx) => (
                        <button 
                            key={idx}
                            onClick={() => handleServerClick(stream)}
                            className={`w-full py-3 px-4 rounded-xl flex items-center justify-between transition-all border group ${
                                currentStream.link === stream.link 
                                ? (tab === 'download' ? 'bg-green-600/20 border-green-500 text-green-400' : 'bg-blue-600 border-blue-500 text-white shadow-lg') 
                                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${currentStream.link === stream.link ? 'bg-current animate-pulse' : 'bg-gray-500'}`}></div>
                                <span className="font-semibold text-sm">{stream.server}</span>
                            </div>
                            
                            {/* Icon changes based on Tab */}
                            {tab === 'download' ? (
                                <ExternalLink size={16} className="text-gray-500 group-hover:text-green-400" />
                            ) : (
                                idx === 0 && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-bold">BEST</span>
                            )}
                        </button>
                    ))}
                 </div>
              </div>

              {/* EXTRA ACTIONS */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                 {tab === 'stream' ? (
                    <div className="space-y-3 animate-fade-in">
                       <button onClick={() => playInApp('org.videolan.vlc')} className="w-full py-3 bg-[#ff6b00]/10 border border-[#ff6b00]/30 hover:bg-[#ff6b00]/20 rounded-xl flex items-center justify-center gap-2 text-[#ff6b00] font-bold transition-all">
                          Play in VLC
                       </button>
                       <button onClick={() => playInApp('com.mxtech.videoplayer.ad')} className="w-full py-3 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 rounded-xl flex items-center justify-center gap-2 text-blue-400 font-bold transition-all">
                          Play in MX Player
                       </button>
                    </div>
                 ) : (
                    <div className="space-y-3 animate-fade-in">
                       <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-center">
                           <p className="text-xs text-green-400">
                               Clicking a server above will open the download popup directly.
                           </p>
                       </div>
                       <button onClick={copyLink} className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center gap-2 text-gray-300 transition-all border border-gray-700">
                          {copied ? <CheckCircle size={18} className="text-green-500"/> : <Copy size={18}/>}
                          {copied ? 'Copied' : 'Copy Direct Link'}
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
    <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}>
      <NCloudPlayer />
    </Suspense>
  );
}
