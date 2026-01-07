'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { 
  CloudLightning, Loader2, Play, AlertTriangle, 
  FolderOpen, Server, ChevronDown, ChevronUp, Database, Film, CheckCircle2, Lock, ShieldCheck
} from 'lucide-react';

// --- Types ---
interface ApiLink {
  name: string;
  url: string;
  isDirect?: boolean;
}

interface LinkGroup {
  title: string;
  quality?: string;
  size?: string;
  links: ApiLink[];
}

function VlyxDriveContent() {
  const params = useSearchParams();
  const router = useRouter();
  const key = params.get('key');
  
  // Status State
  const [status, setStatus] = useState<'processing' | 'tokenizing' | 'bypassing' | 'success' | 'error'>('processing'); 
  const [statusMsg, setStatusMsg] = useState('Initializing Secure Connection...');
  
  // Data State
  const [metaData, setMetaData] = useState<any>(null);
  const [serverData, setServerData] = useState<LinkGroup[]>([]);
  
  // UI State
  const [expandedServers, setExpandedServers] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (key) {
      const processLink = async () => {
        try {
          // 1. Decode Metadata
          // Note: Key ko safe decode kar rahe hain
          const cleanKey = key.replace(/-/g, '+').replace(/_/g, '/');
          const json = atob(cleanKey);
          const payload = JSON.parse(json);
          setMetaData(payload);

          // ----------------------------------------------------
          // 🚀 STEP 1: N-CLOUD (Token Extraction)
          // ----------------------------------------------------
          setStatus('tokenizing');
          setStatusMsg('Authenticating with V-Cloud & Extracting Tokens...');

          const ncloudRes = await fetch(`/api/ncloud?key=${key}`);
          const ncloudData = await ncloudRes.json();

          if (!ncloudData.success || !ncloudData.finalUrl) {
            throw new Error(ncloudData.error || "Token generation failed");
          }

          // ----------------------------------------------------
          // 🚀 STEP 2: GEN SCRAPER (Final Link)
          // ----------------------------------------------------
          setStatus('bypassing');
          setStatusMsg('Bypassing Restrictions & Generating Direct Links...');

          // Ab hum us GamerXYT URL ko Gen API ko bhejenge
          const genRes = await fetch(`/api/gen?url=${encodeURIComponent(ncloudData.finalUrl)}`);
          const genData = await genRes.json();

          if (!genData.success || !genData.streamLink) {
             throw new Error(genData.error || "Final link generation failed");
          }

          // ----------------------------------------------------
          // ✅ SUCCESS: Build Server List
          // ----------------------------------------------------
          const finalLinks: LinkGroup[] = [];

          // 1. VIP Server (Direct Link)
          finalLinks.push({
             title: "⚡ Fast Cloud (VIP)",
             quality: payload.quality || "HD",
             links: [
                 { name: "Direct Server 1 (No Ads)", url: genData.streamLink, isDirect: true },
             ]
          });

          // 2. Backup Server (Original HubCloud)
          if (payload.link || payload.url) {
              finalLinks.push({
                  title: "☁️ HubCloud (Backup)",
                  quality: "Standard",
                  links: [
                      { name: "Original Server", url: payload.link || payload.url }
                  ]
              });
          }

          setServerData(finalLinks);
          setExpandedServers({ 0: true }); // Auto-expand first group
          setStatus('success');

        } catch (err: any) {
          console.error("VlyxDrive Error:", err);
          setStatus('error');
          setStatusMsg(err.message || "Failed to process links.");
        }
      };

      processLink();
    }
  }, [key]);

  const toggleServerExpand = (index: number) => {
    setExpandedServers(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handlePlay = (url: string) => {
     window.location.href = url; // Direct Play
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-10 px-4">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-10 animate-fade-in-up">
        {/* Poster */}
        <div className="relative group shrink-0">
          <div className="w-[140px] md:w-[160px] aspect-[2/3] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.1)] border border-white/10 relative z-10 bg-gray-900">
             {metaData?.poster ? (
               <img src={metaData.poster} className="w-full h-full object-cover" alt="Poster" />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600"><Film size={32}/></div>
             )}
          </div>
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-yellow-500/20 blur-3xl -z-10 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-700"></div>
        </div>

        {/* Info */}
        <div className="text-center md:text-left space-y-3">
           <h1 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 leading-tight">
             {metaData?.title || "Processing Request..."}
           </h1>
           <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-400">
              {metaData?.quality && <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20 font-bold text-xs">{metaData.quality}</span>}
              <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-green-400"/> VlyxDrive Secured</span>
           </div>
        </div>
      </div>

      {/* STATUS & LOADING AREA */}
      <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden min-h-[300px] shadow-2xl">
        
        {/* Background Grid Animation */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, gray 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>

        {/* LOADING STATE */}
        {status !== 'success' && status !== 'error' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#121212]/90 backdrop-blur-sm space-y-6">
              <div className="relative">
                 <div className="w-20 h-20 border-4 border-gray-800 rounded-full"></div>
                 <div className="w-20 h-20 border-4 border-yellow-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Lock size={24} className="text-gray-400" />
                 </div>
              </div>
              <div className="text-center space-y-2">
                 <h3 className="text-xl font-bold text-white animate-pulse">Processing Link</h3>
                 <p className="text-sm text-gray-400 font-mono">{statusMsg}</p>
                 
                 {/* Progress Steps Visual */}
                 <div className="flex gap-2 justify-center mt-4">
                    <div className={`h-1.5 w-8 rounded-full transition-colors duration-500 ${['tokenizing', 'bypassing', 'success'].includes(status) ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                    <div className={`h-1.5 w-8 rounded-full transition-colors duration-500 ${['bypassing', 'success'].includes(status) ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                    <div className={`h-1.5 w-8 rounded-full transition-colors duration-500 ${['success'].includes(status) ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                 </div>
              </div>
           </div>
        )}

        {/* SUCCESS STATE (Server List) */}
        {status === 'success' && (
           <div className="relative z-10 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-4">
                 <h2 className="text-xl font-bold flex items-center gap-2 text-green-400">
                    <CheckCircle2 size={24} /> Links Generated
                 </h2>
                 <span className="text-xs text-gray-500 font-mono">ENCRYPTED::CONNECTION</span>
              </div>

              {serverData.length > 0 ? (
                 serverData.map((group, idx) => (
                    <div key={idx} className="bg-black/40 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all">
                       {/* Header */}
                       <button 
                         onClick={() => toggleServerExpand(idx)}
                         className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-900 transition-colors"
                       >
                          <div className="flex items-center gap-3">
                             <Server size={18} className="text-purple-400" />
                             <span className="font-bold text-gray-200">{group.title}</span>
                             {group.quality && <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{group.quality}</span>}
                          </div>
                          {expandedServers[idx] ? <ChevronUp size={18} className="text-gray-500"/> : <ChevronDown size={18} className="text-gray-500"/>}
                       </button>

                       {/* Links Body */}
                       {expandedServers[idx] && (
                          <div className="p-2 space-y-2">
                             {group.links.map((link, lIdx) => (
                                <button
                                  key={lIdx}
                                  onClick={() => handlePlay(link.url)}
                                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all group ${
                                      link.isDirect 
                                        ? 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20' 
                                        : 'bg-transparent border-transparent hover:bg-gray-800'
                                  }`}
                                >
                                   <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                          link.isDirect ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'
                                      }`}>
                                         <Play size={14} fill="currentColor" />
                                      </div>
                                      <div className="text-left">
                                         <span className={`block text-sm font-medium ${link.isDirect ? 'text-yellow-400' : 'text-gray-300'}`}>
                                            {link.name}
                                         </span>
                                         {link.isDirect && <span className="text-[10px] text-gray-500">High Speed • No Ads</span>}
                                      </div>
                                   </div>
                                   <div className={`text-xs font-bold transition-opacity ${link.isDirect ? 'text-yellow-500' : 'text-gray-500 opacity-0 group-hover:opacity-100'}`}>
                                      PLAY
                                   </div>
                                </button>
                             ))}
                          </div>
                       )}
                    </div>
                 ))
              ) : (
                 <div className="text-center text-gray-500 py-10">No servers found.</div>
              )}
           </div>
        )}

        {/* ERROR STATE */}
        {status === 'error' && (
           <div className="text-center py-20 animate-fade-in">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white">Link Generation Failed</h3>
              <p className="text-gray-400 max-w-md mx-auto mt-2 mb-6">{statusMsg}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-all shadow-lg shadow-red-900/20"
              >
                Retry Connection
              </button>
           </div>
        )}

      </div>
    </div>
  );
}

export default function VlyxDrive() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4">
      <Suspense fallback={<div className="text-white text-center mt-20">Initializing VlyxDrive...</div>}>
        <VlyxDriveContent />
      </Suspense>
    </div>
  );
}
