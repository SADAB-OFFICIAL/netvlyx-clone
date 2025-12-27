// app/ncloud/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import { 
  Play, Download, CloudLightning, Wifi, Loader2, 
  AlertTriangle, Copy, CheckCircle, Server, HardDrive
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
  const [streams, setStreams] = useState<Stream[]>([]); // List of all valid servers
  const [currentStream, setCurrentStream] = useState<Stream | null>(null); // Currently playing
  const [metaData, setMetaData] = useState<any>(null); // Poster/Title from previous page
  const [apiTitle, setApiTitle] = useState(''); // Title from API
  
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

          // 2. Fetch Streams from our Backend
          const res = await fetch(`/api/ncloud?url=${payload.url}`); // No encode needed if backend handles it, but safer to match logic
          const result = await res.json();
          
          if (result.success && result.streams.length > 0) {
             setStreams(result.streams);
             setCurrentStream(result.streams[0]); // Auto play first (best) server
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
      // Auto scroll to player or highlight can be added here
  };

  const copyLink = () => {
    if (currentStream?.link) {
      navigator.clipboard.writeText(currentStream.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
                Server: {currentStream.server}
                </p>
            </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
           
           {/* LEFT COLUMN: PLAYER */}
           <div className="lg:col-span-2 space-y-4">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                 <video 
                    key={currentStream.link} // Key change forces reload on server switch
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
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1 break-all">
                      File: {apiTitle}
                  </p>
              </div>
           </div>

           {/* RIGHT COLUMN: SERVERS & ACTIONS */}
           <div className="lg:col-span-1 space-y-4">
              
              {/* SERVER SELECTOR */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <Server size={14} /> Switch Server
                 </h3>
                 <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700">
                    {streams.map((stream, idx) => (
                        <button 
                            key={idx}
                            onClick={() => changeServer(stream)}
                            className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between transition-all border ${
                                currentStream.link === stream.link 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <HardDrive size={16} />
                                <span className="font-semibold text-sm">{stream.server}</span>
                            </div>
                            {currentStream.link === stream.link && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </button>
                    ))}
                 </div>
              </div>

              {/* ACTIONS CARD */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                 <div className="flex p-1 bg-black/40 rounded-lg mb-4">
                    <button onClick={() => setTab('stream')} className={`flex-1 py-2 text-sm font-bold rounded ${tab === 'stream' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Stream</button>
                    <button onClick={() => setTab('download')} className={`flex-1 py-2 text-sm font-bold rounded ${tab === 'download' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>Download</button>
                 </div>

                 {tab === 'stream' ? (
                    <div className="space-y-3">
                       <button onClick={playInVLC} className="w-full py-3 bg-[#ff6b00]/10 border border-[#ff6b00]/30 hover:bg-[#ff6b00]/20 rounded-xl flex items-center justify-center gap-2 text-[#ff6b00] font-bold transition-all">
                          <Play size={18} className="fill-current"/> Play in VLC
                       </button>
                       <button onClick={playInMX} className="w-full py-3 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 rounded-xl flex items-center justify-center gap-2 text-blue-400 font-bold transition-all">
                          <Play size={18} className="fill-current"/> Play in MX
                       </button>
                    </div>
                 ) : (
                    <div className="space-y-3">
                       <a href={currentStream.link} download className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl flex items-center justify-center gap-2 text-white font-bold transition-all shadow-lg shadow-green-900/20">
                          <Download size={18}/> Direct Download
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
    <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}>
      <NCloudPlayer />
    </Suspense>
  );
}
