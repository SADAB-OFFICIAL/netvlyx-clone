// app/vlyxdrive/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { 
  CloudLightning, Loader2, Play, AlertTriangle, 
  FolderOpen, Server, HardDrive, CheckCircle, ChevronDown, ChevronUp, Film, Database
} from 'lucide-react';

// --- Types based on your JSON ---
interface ApiLink {
  name: string;
  url: string;
  isVCloud?: boolean;
  isHubCloud?: boolean;
}

interface LinkGroup {
  title: string;      // e.g., "480p [1.5GB]" or "Episode 1"
  quality?: string;   // e.g., "480p"
  size?: string;      // e.g., "1.5GB"
  episodeNumber?: number; // Only for series
  links: ApiLink[];
}

function VlyxDriveContent() {
  const params = useSearchParams();
  const router = useRouter();
  const key = params.get('key');
  
  const [status, setStatus] = useState('processing'); 
  const [metaData, setMetaData] = useState<any>(null);
  const [apiData, setApiData] = useState<any>(null); // Full JSON Response
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (key) {
      const init = async () => {
        try {
          const json = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(json);
          setMetaData(payload);

          // Fetch from our Proxy (which calls NetVlyx API)
          const res = await fetch(`/api/resolve-link?url=${encodeURIComponent(payload.link)}`);
          const result = await res.json();
          
          if (result.success && result.data) {
             setApiData(result.data); // data.type can be 'quality' (Movie) or 'episode' (Series)
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

  const toggleExpand = (idx: number) => {
    setExpandedGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Helper to style buttons based on server name
  const getButtonClass = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('hub') || lower.includes('cloud') || lower.includes('n-cloud')) 
          return "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-yellow-400";
      if (lower.includes('gdflix') || lower.includes('drive')) 
          return "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white";
      return "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600";
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
                />
                <div className="text-center md:text-left flex-1">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold mb-3 border border-blue-500/30">
                      <FolderOpen size={12} /> SECURE DRIVE
                   </div>
                   <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                      {metaData.title}
                   </h1>
                   <p className="text-gray-400 text-sm">
                      {apiData?.type === 'quality' ? 'Movie • Select Quality' : 'Series • Select Episode'}
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
              
              {/* CASE 1: MOVIE (Quality Groups) */}
              {apiData.type === 'quality' && (
                 apiData.linkData.map((group: LinkGroup, idx: number) => (
                    <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
                       <div className="bg-gray-800/60 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                             <Database className="text-purple-500" size={20} />
                             {group.quality} <span className="text-sm font-normal text-gray-400 ml-2 bg-black/30 px-2 py-0.5 rounded">{group.size}</span>
                          </h3>
                       </div>
                       <div className="p-5 flex flex-col gap-3">
                          {group.links.map((link, i) => (
                             <button 
                                key={i}
                                onClick={() => handlePlay(link.url)}
                                className={`w-full py-3 px-5 rounded-xl font-bold flex items-center justify-between shadow-lg transform hover:scale-[1.01] transition-all ${getButtonClass(link.name)}`}
                             >
                                <span className="flex items-center gap-3">
                                   {link.name.includes('Hub') ? <CloudLightning size={18} /> : <Server size={18} />}
                                   {link.name}
                                </span>
                                <Play size={18} />
                             </button>
                          ))}
                       </div>
                    </div>
                 ))
              )}

              {/* CASE 2: SERIES (Episode Groups) */}
              {apiData.type === 'episode' && (
                 // Assuming 'linkData' contains episodes for series too based on your structure hint
                 apiData.linkData.map((group: LinkGroup, idx: number) => {
                    const isExpanded = expandedGroups[idx];
                    // Prefer HubCloud links first
                    const sortedLinks = [...group.links].sort((a, b) => {
                        const aHub = a.name.includes('Hub') || a.isHubCloud;
                        const bHub = b.name.includes('Hub') || b.isHubCloud;
                        return aHub === bHub ? 0 : aHub ? -1 : 1;
                    });
                    const mainLink = sortedLinks[0];
                    const otherLinks = sortedLinks.slice(1);

                    return (
                       <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-600 transition-all">
                          <div className="p-4 flex flex-col sm:flex-row items-center gap-4">
                              <div className="flex-1 text-center sm:text-left">
                                  <h3 className="text-lg font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                                      <Film className="text-blue-500" size={20} /> 
                                      {group.title || `Episode ${group.episodeNumber || idx + 1}`}
                                  </h3>
                              </div>
                              
                              <div className="flex flex-col gap-2 w-full sm:w-auto">
                                  {/* Play Main Link */}
                                  <button 
                                      onClick={() => handlePlay(mainLink.url)}
                                      className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg ${getButtonClass(mainLink.name)}`}
                                  >
                                      <Play size={18} className="fill-current" /> Play Now
                                  </button>
                                  
                                  {/* Toggle Others */}
                                  {otherLinks.length > 0 && (
                                      <button 
                                          onClick={() => toggleExpand(idx)}
                                          className="text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1 py-1"
                                      >
                                          {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                          {isExpanded ? 'Hide Servers' : `${otherLinks.length} More Servers`}
                                      </button>
                                  )}
                              </div>
                          </div>

                          {/* Expanded Other Links */}
                          {isExpanded && otherLinks.length > 0 && (
                              <div className="bg-black/20 p-4 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                                  {otherLinks.map((link, i) => (
                                      <button 
                                          key={i}
                                          onClick={() => handlePlay(link.url)}
                                          className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors border border-gray-700"
                                      >
                                          <Server size={14} /> {link.name}
                                      </button>
                                  ))}
                              </div>
                          )}
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
