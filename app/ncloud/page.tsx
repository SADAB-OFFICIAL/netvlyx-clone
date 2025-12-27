// app/ncloud/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import { 
  Play, Download, CloudLightning, Wifi, Smartphone, 
  Settings, Volume2, Maximize, AlertTriangle, Loader2, Copy 
} from 'lucide-react';

function NCloudPlayer() {
  const params = useSearchParams();
  const key = params.get('key');
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'stream' | 'download'>('stream');
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (key) {
      try {
        const json = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(json);
        setData(payload);
        setLoading(false);
      } catch (e) {
        console.error("Invalid Key");
        setLoading(false);
      }
    }
  }, [key]);

  const copyLink = () => {
    if (data?.url) {
      navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const playInVLC = () => {
    if (!data?.url) return;
    // Android Intent for VLC
    const intent = `intent:${data.url}#Intent;package=org.videolan.vlc;type=video/*;scheme=https;end`;
    window.location.href = intent;
  };

  const playInMX = () => {
    if (!data?.url) return;
    // Android Intent for MX Player
    const intent = `intent:${data.url}#Intent;package=com.mxtech.videoplayer.ad;type=video/*;scheme=https;end`;
    window.location.href = intent;
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
      <p className="text-gray-400 animate-pulse">Connecting to Secure Cloud...</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-red-500">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
        <p>Invalid Session</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                <CloudLightning className="text-white w-6 h-6" />
             </div>
             <div>
                <h1 className="text-2xl font-bold tracking-tight">N-Cloud</h1>
                <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                   <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                   </span>
                   Secure Connection Active
                </div>
             </div>
          </div>
          <button 
             onClick={() => window.history.back()}
             className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
          >
             Close Player
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
           
           {/* LEFT: Player / Preview Area */}
           <div className="lg:col-span-2 space-y-4">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl group">
                 {/* HTML5 Video Player */}
                 <video 
                    ref={videoRef}
                    controls 
                    className="w-full h-full object-contain" 
                    poster={data.poster || '/placeholder.png'}
                    src={data.url}
                 >
                    Your browser does not support the video tag.
                 </video>
                 
                 {/* Custom Overlay (Optional - removes default controls if needed) */}
                 <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-mono border border-white/10">HD 1080p</span>
                 </div>
              </div>

              {/* Title & Metadata */}
              <div>
                 <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{data.title || 'Unknown Title'}</h2>
                 <p className="text-gray-400 text-sm flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Wifi size={14}/> High Speed</span>
                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                    <span>MP4 / MKV</span>
                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                    <span className="text-blue-400">Cloud Stream</span>
                 </p>
              </div>
           </div>

           {/* RIGHT: Controls & Actions */}
           <div className="lg:col-span-1">
              <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 h-full flex flex-col">
                 
                 {/* Tabs */}
                 <div className="flex p-1 bg-gray-950/50 rounded-xl mb-6">
                    <button 
                       onClick={() => setTab('stream')}
                       className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tab === 'stream' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                       <Play size={16} /> Stream
                    </button>
                    <button 
                       onClick={() => setTab('download')}
                       className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tab === 'download' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                       <Download size={16} /> Download
                    </button>
                 </div>

                 {/* TAB CONTENT */}
                 <div className="flex-1 space-y-4">
                    
                    {tab === 'stream' && (
                       <div className="space-y-3 animate-fade-in">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">External Players</p>
                          
                          <button onClick={playInVLC} className="w-full py-4 px-4 bg-[#ff6b00]/10 hover:bg-[#ff6b00]/20 border border-[#ff6b00]/30 hover:border-[#ff6b00] rounded-xl flex items-center gap-3 transition-all group">
                             <div className="w-10 h-10 bg-[#ff6b00] rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
                             </div>
                             <div className="text-left">
                                <div className="font-bold text-white">Play in VLC</div>
                                <div className="text-xs text-gray-400">Recommended for smooth playback</div>
                             </div>
                          </button>

                          <button onClick={playInMX} className="w-full py-4 px-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 hover:border-blue-500 rounded-xl flex items-center gap-3 transition-all group">
                             <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                <Play size={20} className="fill-current"/>
                             </div>
                             <div className="text-left">
                                <div className="font-bold text-white">Play in MX Player</div>
                                <div className="text-xs text-gray-400">Best for Android users</div>
                             </div>
                          </button>
                       </div>
                    )}

                    {tab === 'download' && (
                       <div className="space-y-3 animate-fade-in">
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Direct Actions</p>
                          
                          <a 
                             href={data.url} 
                             download 
                             className="w-full py-4 px-4 bg-green-600 hover:bg-green-500 text-white rounded-xl flex items-center justify-center gap-3 font-bold shadow-lg shadow-green-900/20 hover:scale-[1.02] transition-all"
                          >
                             <Download size={20} /> Browser Download
                          </a>

                          <button 
                             onClick={copyLink}
                             className="w-full py-4 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-xl flex items-center justify-center gap-3 text-gray-300 hover:text-white transition-all"
                          >
                             {copied ? <CheckCircle className="text-green-500" size={20}/> : <Copy size={20} />}
                             {copied ? 'Link Copied!' : 'Copy Stream Link'}
                          </button>
                          
                          <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20 mt-4">
                             <p className="text-xs text-yellow-500 text-center">
                                Use IDM or 1DM for faster download speeds.
                             </p>
                          </div>
                       </div>
                    )}

                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}

function CheckCircle({className, size}: {className?: string, size?: number}) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
}

export default function NCloud() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading N-Cloud...</div>}>
      <NCloudPlayer />
    </Suspense>
  );
}
