'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { 
  CloudLightning, Loader2, Play, AlertTriangle, 
  FolderOpen, Server, ChevronDown, ChevronUp, Database, Film
} from 'lucide-react';

// --- Types ---
interface ApiLink {
  name: string;
  url: string;
  isVCloud?: boolean;
  isHubCloud?: boolean;
}

interface LinkGroup {
  title: string;
  quality?: string;
  size?: string;
  links: ApiLink[];
  episodeNumber?: number;
}

function VlyxDriveContent() {
  const params = useSearchParams();
  const router = useRouter();
  const key = params.get('key');
  
  const [status, setStatus] = useState('processing'); 
  const [metaData, setMetaData] = useState<any>(null);
  const [apiData, setApiData] = useState<any>(null);
  
  // State to track which server lists are expanded
  const [expandedServers, setExpandedServers] = useState<Record<number, boolean>>({});
  // State to track hidden qualities (Movie mode)
  const [showOtherQualities, setShowOtherQualities] = useState(false);

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

  const toggleServerExpand = (idx: number) => {
    setExpandedServers(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ---------------------------------------------------------
  // 🧠 PRIORITY LOGIC (Updated)
  // ---------------------------------------------------------
  const splitLinks = (links: ApiLink[]) => {
      // Priority Keywords (Order Matters: Top to Bottom)
      const priorityList = [
          'hubcloud', 'n-cloud', 'fast cloud', 'fsl', 'hub', // Rank 1: VIP/NCloud
          '10gbps', 'g-direct', 'drive', 'google',           // Rank 2: High Speed
          'gdflix', 'cloud'                                  // Rank 3: Standard
      ];

      const getPriorityScore = (name: string) => {
          const lower = name.toLowerCase();
          const index = priorityList.findIndex(p => lower.includes(p));
          // Agar list me nahi hai, to sabse last (999)
          return index === -1 ? 999 : index;
      };

      const sorted = [...links].sort((a, b) => {
          return getPriorityScore(a.name) - getPriorityScore(b.name);
      });

      return {
          main: sorted[0],       // Highest Priority Link
          others: sorted.slice(1) // Rest go to "Show More"
      };
  };

  // Helper for button styling (Updated for FSL/Fast Cloud)
  const getButtonClass = (name: string) => {
      const lower = name.toLowerCase();
      // VIP / N-Cloud Style (Orange/Gold)
      if (lower.includes('hub') || lower.includes('cloud') || lower.includes('fast') || lower.includes('fsl')) 
          return "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-yellow-400";
      // Drive / High Speed Style (Green)
      if (lower.includes('gdflix') || lower.includes('drive') || lower.includes('10gbps')) 
          return "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white";
      // Standard (Gray)
      return "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600";
  };

  // Helper for Main Button Text (Updated)
  const getMainButtonText = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('hub') || lower.includes('n-cloud') || lower.includes('fast') || lower.includes('fsl')) {
          return "Continue with N-Cloud";
      }
      return `Play via ${name}`;
  };

  // --- FILTERING LOGIC ---
  const getFilteredGroups = () => {
    if (!apiData || apiData.type !== 'quality') return { preferred: [], others: [] };
    const userQuality = metaData?.quality?.toLowerCase(); 

    if (!userQuality || userQuality === 'standard') {
        return { preferred: apiData.linkData as LinkGroup[], others: [] as LinkGroup[] };
    }

    const preferred: LinkGroup[] = [];
    const others: LinkGroup[] = [];

    (apiData.linkData as LinkGroup[]).forEach((group) => {
        const groupQ = group.quality?.toLowerCase() || '';
        if (groupQ.includes(userQuality) || userQuality.includes(groupQ)) {
            preferred.push(group);
        } else {
            others.push(group);
        }
    });

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
                <img 
                  src={metaData.poster || '/placeholder.png'} 
                  className="w-24 h-36 object-cover rounded-xl shadow-lg border border-gray-700" 
                  alt="Poster" 
                  onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150x225?text=No+Poster')}
                />
                <div className="text-center md:text-left flex-1">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold mb-3 border border-blue-500/30">
                      <FolderOpen size={12} /> SECURE DRIVE
                   </div>
                   <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                      {metaData.title}
                   </h1>
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
                           {preferred.map((group: LinkGroup, idx: number) => {
                              const { main, others: otherServers } = splitLinks(group.links);
                              const isExpanded = expandedServers[idx];

                              return (
                                <div key={idx} className="bg-gray-900/50 border-2 border-green-500/30 rounded-2xl overflow-hidden shadow-2xl relative">
                                   <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl z-10">SELECTED</div>
                                   <div className="bg-gray-800/60 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                         <Database className="text-green-400" size={24} />
                                         {group.quality} <span className="text-sm font-normal text-gray-400 ml-2 bg-black/30 px-2 py-0.5 rounded">{group.size}</span>
                                      </h3>
                                   </div>
                                   <div className="p-5 flex flex-col gap-3">
                                      {/* MAIN BUTTON (Priority Link) */}
                                      <button 
                                          onClick={() => handlePlay(main.url)} 
                                          className={`w-full py-4 px-6 rounded-xl font-bold flex items-center justify-between shadow-lg transform hover:scale-[1.01] transition-all ${getButtonClass(main.name)}`}
                                      >
                                          <span className="flex items-center gap-3">
                                              <CloudLightning size={24} className="fill-current" />
                                              <span className="text-lg">{getMainButtonText(main.name)}</span>
                                          </span>
                                          <Play size={24} className="fill-current" />
                                      </button>

                                      {/* EXPAND BUTTON */}
                                      {otherServers.length > 0 && (
                                          <div className="mt-2">
                                              <button 
                                                  onClick={() => toggleServerExpand(idx)}
                                                  className="w-full text-center py-2 text-sm text-gray-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
                                              >
                                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                  {isExpanded ? 'Hide Servers' : `Show ${otherServers.length} more servers`}
                                              </button>

                                              {/* HIDDEN SERVERS LIST */}
                                              {isExpanded && (
                                                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                                                      {otherServers.map((link, i) => (
                                                          <button 
                                                              key={i} 
                                                              onClick={() => handlePlay(link.url)} 
                                                              className={`px-4 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all border ${getButtonClass(link.name)}`}
                                                          >
                                                              <Server size={16} /> {link.name}
                                                          </button>
                                                      ))}
                                                  </div>
                                              )}
                                          </div>
                                      )}
                                   </div>
                                </div>
                              );
                           })}

                           {/* OTHER QUALITIES */}
                           {others.length > 0 && (
                               <div className="mt-8 pt-6 border-t border-gray-800">
                                   <button 
                                      onClick={() => setShowOtherQualities(!showOtherQualities)}
                                      className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all"
                                   >
                                      {showOtherQualities ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                      {showOtherQualities ? 'Hide Other Qualities' : `Show ${others.length} Other Qualities`}
                                   </button>
                                   
                                   {showOtherQualities && (
                                       <div className="mt-4 space-y-4 animate-fade-in">
                                           {others.map((group: LinkGroup, idx: number) => (
                                              <div key={idx} className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-300">
                                                 <div className="px-6 py-3 border-b border-gray-800 bg-black/20 flex justify-between items-center">
                                                    <h3 className="text-lg font-bold text-gray-400">{group.quality}</h3>
                                                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{group.size}</span>
                                                 </div>
                                                 <div className="p-4 flex flex-col gap-2">
                                                    {group.links.map((link, i) => (
                                                       <button key={i} onClick={() => handlePlay(link.url)} className="w-full py-3 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-left text-sm text-gray-300 flex items-center gap-2 border border-gray-700 hover:border-blue-500">
                                                          <Server size={16} className="text-blue-500"/> {link.name}
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

              {/* CASE 2: SERIES (Episode Groups) */}
              {apiData.type === 'episode' && (
                 (apiData.linkData as LinkGroup[]).map((group: LinkGroup, idx: number) => {
                    const { main, others: otherServers } = splitLinks(group.links);
                    const isExpanded = expandedServers[idx];

                    return (
                       <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-600 transition-all">
                          <div className="p-5 flex flex-col sm:flex-row items-center gap-6">
                              <div className="flex-1 text-center sm:text-left">
                                  <h3 className="text-lg font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                                      <Film className="text-blue-500" size={24} /> 
                                      {group.title || `Episode ${group.episodeNumber || idx + 1}`}
                                  </h3>
                              </div>
                              
                              <div className="flex flex-col gap-2 w-full sm:w-auto min-w-[280px]">
                                  {/* MAIN BUTTON */}
                                  <button 
                                      onClick={() => handlePlay(main.url)}
                                      className={`w-full py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg ${getButtonClass(main.name)}`}
                                  >
                                      <Play size={20} className="fill-current" /> 
                                      {getMainButtonText(main.name)}
                                  </button>
                                  
                                  {/* SHOW MORE TOGGLE */}
                                  {otherServers.length > 0 && (
                                      <div className="relative">
                                          {!isExpanded ? (
                                              <button 
                                                  onClick={() => toggleServerExpand(idx)}
                                                  className="w-full py-2 text-xs text-gray-500 hover:text-white flex items-center justify-center gap-1 transition-colors hover:bg-white/5 rounded-lg"
                                              >
                                                  <ChevronDown size={12}/> Show {otherServers.length} more servers
                                              </button>
                                          ) : (
                                              <div className="mt-2 space-y-2 animate-fade-in bg-black/40 p-3 rounded-xl border border-gray-800">
                                                  {otherServers.map((link, i) => (
                                                      <button 
                                                          key={i}
                                                          onClick={() => handlePlay(link.url)}
                                                          className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 hover:text-white transition-colors border border-gray-700"
                                                      >
                                                          <Server size={12} /> {link.name}
                                                      </button>
                                                  ))}
                                                  <button 
                                                      onClick={() => toggleServerExpand(idx)}
                                                      className="w-full text-center text-xs text-gray-500 hover:text-white pt-1"
                                                  >
                                                      <ChevronUp size={12}/> Hide
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                  )}
                              </div>
                          </div>
                       </div>
                    );
                 })
              )}

           </div>
        )}

        {/* Error State */}
        {status === 'error' && (
           <div className="text-center py-20">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white">Data Fetch Failed</h3>
              <p className="text-gray-400">Could not retrieve links from the API.</p>
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
