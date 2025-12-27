// app/vlyxdrive/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { 
  CloudLightning, Loader2, Play, AlertTriangle, 
  FolderOpen, Server, CheckCircle, ChevronDown, ChevronUp, Database
} from 'lucide-react';

interface LinkGroup {
  title: string;
  quality?: string;
  size?: string;
  links: any[];
}

function VlyxDriveContent() {
  const params = useSearchParams();
  const router = useRouter();
  const key = params.get('key');
  
  const [status, setStatus] = useState('processing'); 
  const [metaData, setMetaData] = useState<any>(null);
  const [apiData, setApiData] = useState<any>(null);
  const [showOthers, setShowOthers] = useState(false);

  useEffect(() => {
    if (key) {
      const init = async () => {
        try {
          const json = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(json);
          setMetaData(payload);

          const res = await fetch(`/api/resolve-link?url=${encodeURIComponent(payload.link)}`);
          const result = await res.json();
          
          if (result.success && result.data) {
             setApiData(result.data);
             setStatus('ready');
          } else {
             setStatus('error');
          }
        } catch (e) {
          setStatus('error');
        }
      };
      init();
    }
  }, [key]);

  const handlePlay = (url: string) => {
    const nCloudKey = btoa(JSON.stringify({ url: url, title: "Stream" }))
       .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    router.push(`/ncloud?key=${nCloudKey}`);
  };

  const getButtonClass = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('hub') || lower.includes('cloud') || lower.includes('n-cloud')) 
          return "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-yellow-400";
      if (lower.includes('gdflix') || lower.includes('drive')) 
          return "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white";
      return "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600";
  };

  // --- FILTERING LOGIC ---
  const getFilteredGroups = () => {
    if (!apiData || apiData.type !== 'quality') return { preferred: [], others: [] };
    
    // User ne jo Quality select ki thi (v page par)
    const userQuality = metaData?.quality?.toLowerCase(); 

    if (!userQuality || userQuality === 'standard') {
        // Agar koi quality select nahi thi, to sab dikhao
        return { preferred: apiData.linkData, others: [] };
    }

    const preferred: LinkGroup[] = [];
    const others: LinkGroup[] = [];

    apiData.linkData.forEach((group: LinkGroup) => {
        const groupQ = group.quality?.toLowerCase() || '';
        // Match 1080p, 720p etc.
        if (groupQ.includes(userQuality) || userQuality.includes(groupQ)) {
            preferred.push(group);
        } else {
            others.push(group);
        }
    });

    // Fallback: Agar exact match nahi mila to pehla wala dikha do
    if (preferred.length === 0 && others.length > 0) {
        return { preferred: [others[0]], others: others.slice(1) };
    }

    return { preferred, others };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 font-sans">
      <div className="max-w-3xl mx-auto animate-fade-in">
        
        {/* Header */}
        {metaData && (
          <div className="relative overflow-hidden bg-gray-900 rounded-3xl border border-gray-800 p-6 mb-8 shadow-2xl">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
             <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start">
                <img src={metaData.poster || '/placeholder.png'} className="w-24 h-36 object-cover rounded-xl shadow-lg border border-gray-700" alt="Poster" />
                <div className="text-center md:text-left flex-1">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold mb-3 border border-blue-500/30">
                      <FolderOpen size={12} /> SECURE DRIVE
                   </div>
                   <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">{metaData.title}</h1>
                   <p className="text-gray-400 text-sm">
                      {apiData?.type === 'quality' 
                         ? `Movie • ${metaData.quality ? metaData.quality : 'Select Quality'}` 
                         : 'Series • Select Episode'}
                   </p>
                </div>
             </div>
          </div>
        )}

        {/* Loading */}
        {status === 'processing' && (
           <div className="text-center py-20">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Fetching links from secure API...</p>
           </div>
        )}

        {/* Content */}
        {status === 'ready' && apiData && (
           <div className="space-y-6">
              
              {/* CASE 1: MOVIE / BULK (Quality Groups) */}
              {apiData.type === 'quality' && (
                 (() => {
                    const { preferred, others } = getFilteredGroups();
                    
                    return (
                        <>
                           {/* PREFERRED QUALITY */}
                           {preferred.map((group, idx) => (
                              <div key={idx} className="bg-gray-900/50 border-2 border-green-500/30 rounded-2xl overflow-hidden shadow-2xl relative">
                                 <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl z-10">SELECTED</div>
                                 <div className="bg-gray-800/60 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                       <Database className="text-green-400" size={24} />
                                       {group.quality} <span className="text-sm font-normal text-gray-400 ml-2 bg-black/30 px-2 py-0.5 rounded">{group.size}</span>
                                    </h3>
                                 </div>
                                 <div className="p-5 flex flex-col gap-3">
                                    {group.links.map((link, i) => (
                                       <button key={i} onClick={() => handlePlay(link.url)} className={`w-full py-3 px-5 rounded-xl font-bold flex items-center justify-between shadow-lg transform hover:scale-[1.01] transition-all ${getButtonClass(link.name)}`}>
                                          <span className="flex items-center gap-3">{link.name.includes('Hub') ? <CloudLightning size={18} /> : <Server size={18} />}{link.name}</span>
                                          <Play size={18} />
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           ))}

                           {/* OTHER QUALITIES (HIDDEN) */}
                           {others.length > 0 && (
                               <div className="mt-6">
                                   <button 
                                      onClick={() => setShowOthers(!showOthers)}
                                      className="w-full py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all"
                                   >
                                      {showOthers ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                      {showOthers ? 'Hide Other Qualities' : `Show ${others.length} Other Qualities`}
                                   </button>
                                   
                                   {showOthers && (
                                       <div className="mt-4 space-y-4 animate-fade-in">
                                           {others.map((group, idx) => (
                                              <div key={idx} className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all">
                                                 <div className="px-6 py-3 border-b border-gray-800 bg-black/20">
                                                    <h3 className="text-lg font-bold text-gray-400">{group.quality} <span className="text-xs ml-2">{group.size}</span></h3>
                                                 </div>
                                                 <div className="p-4 flex flex-col gap-2">
                                                    {group.links.map((link, i) => (
                                                       <button key={i} onClick={() => handlePlay(link.url)} className="w-full py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-left text-sm text-gray-300 flex items-center gap-2">
                                                          <Server size={14}/> {link.name}
                                                       </button>
                                                    ))}
                                                 </div>
                                              </div>
                                           ))}
                                       </div>
                                   )}
                               </div>
                           )}
                        </>
                    );
                 })()
              )}

              {/* CASE 2: SERIES (Episode Groups) - Same as before */}
              {apiData.type === 'episode' && (
                 // (Series Logic same as previous response, no changes needed here)
                 apiData.linkData.map((group: any, idx: number) => (
                    <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-600 transition-all">
                        <div className="p-4 flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex-1 text-center sm:text-left"><h3 className="text-lg font-bold text-white">{group.title}</h3></div>
                            <div className="flex flex-col gap-2 w-full sm:w-auto">
                                <button onClick={() => handlePlay(group.links[0].url)} className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg ${getButtonClass(group.links[0].name)}`}>
                                    <Play size={18} className="fill-current" /> Play Now
                                </button>
                            </div>
                        </div>
                    </div>
                 ))
              )}

           </div>
        )}
      </div>
    </div>
  );
}

export default function VlyxDrive() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4">
      <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}>
        <VlyxDriveContent />
      </Suspense>
    </div>
  );
}
