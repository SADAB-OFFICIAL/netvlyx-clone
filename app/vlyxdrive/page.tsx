// app/ncloud/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import { 
  Play, Download, CloudLightning, Wifi, Loader2, 
  AlertTriangle, Copy, CheckCircle 
} from 'lucide-react';

function NCloudPlayer() {
  const params = useSearchParams();
  const key = params.get('key');
  
  const [loading, setLoading] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null); // Asli Video Link
  const [metaData, setMetaData] = useState<any>(null); // Title, Poster
  const [tab, setTab] = useState<'stream' | 'download'>('stream');
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (key) {
      const init = async () => {
        try {
          // 1. Decode Data from URL
          const json = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(json);
          setMetaData(payload);

          // 2. Call Backend Scraper (The "2-Step" Magic)
          const res = await fetch(`/api/ncloud?url=${encodeURIComponent(payload.url)}`);
          const result = await res.json();
          
          if (result.success && result.streamUrl) {
             setStreamUrl(result.streamUrl);
             setLoading(false);
          } else {
             throw new Error("Failed to generate link");
          }
        } catch (e) {
          console.error("Link Generation Failed");
          setLoading(false);
        }
      };
      init();
    }
  }, [key]);

  const copyLink = () => {
    if (streamUrl) {
      navigator.clipboard.writeText(streamUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const playInVLC = () => {
    if (!streamUrl) return;
    const intent = `intent:${streamUrl}#Intent;package=org.videolan.vlc;type=video/*;scheme=https;end`;
    window.location.href = intent;
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <div className="relative mb-4">
         <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500"></div>
         <CloudLightning className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400" size={24}/>
      </div>
      <p className="text-gray-400 font-mono text-sm">Generating Secure Token...</p>
      <p className="text-xs text-gray-600 mt-2">Bypassing Cloudflare • Handshaking</p>
    </div>
  );

  if (!streamUrl) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-red-500">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
        <p>Stream Generation Failed</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-gray-800 rounded text-white text-sm">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                 <CloudLightning className="text-white" size={20}/>
              </div>
              <div>
                 <h1 className="text-xl font-bold">N-Cloud Player</h1>
                 <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Secure • Tokenized
                 </p>
              </div>
           </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
           {/* VIDEO PLAYER */}
           <div className="lg:col-span-2 space-y-4">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                 <video 
                    controls 
                    autoPlay
                    className="w-full h-full" 
                    poster={metaData?.poster || ''}
                    src={streamUrl}
                 >
                 </video>
              </div>
              <h2 className="text-2xl font-bold text-white">{metaData?.title || 'Unknown Title'}</h2>
           </div>

           {/* CONTROLS */}
           <div className="lg:col-span-1 space-y-4">
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                 {/* Tabs */}
                 <div className="flex p-1 bg-black/40 rounded-lg mb-6">
                    <button onClick={() => setTab('stream')} className={`flex-1 py-2 text-sm font-bold rounded ${tab === 'stream' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Stream</button>
                    <button onClick={() => setTab('download')} className={`flex-1 py-2 text-sm font-bold rounded ${tab === 'download' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>Download</button>
                 </div>

                 {tab === 'stream' ? (
                    <div className="space-y-3">
                       <button onClick={playInVLC} className="w-full py-3 bg-[#ff6b00]/10 border border-[#ff6b00]/30 hover:bg-[#ff6b00]/20 rounded-xl flex items-center justify-center gap-2 text-[#ff6b00] font-bold transition-all">
                          Play in VLC
                       </button>
                       {/* Add more players here */}
                    </div>
                 ) : (
                    <div className="space-y-3">
                       <a href={streamUrl} download className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl flex items-center justify-center gap-2 text-white font-bold transition-all">
                          <Download size={18}/> Direct Download
                       </a>
                       <button onClick={copyLink} className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center gap-2 text-gray-300 transition-all">
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
