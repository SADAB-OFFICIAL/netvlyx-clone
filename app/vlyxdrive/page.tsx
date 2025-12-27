'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { 
  CloudLightning, Loader2, Play, AlertTriangle, 
  FolderOpen, Server, HardDrive, CheckCircle, ChevronDown, ChevronUp
} from 'lucide-react';

// --- Types ---
interface FileLink {
  title: string;
  url: string;
  source: string;
  isPreferred: boolean;
}

interface EpisodeGroup {
  id: string;
  episodeNumber: number;
  title: string;
  links: FileLink[];
}

// --- Helpers ---
const getSourceName = (url: string, title: string) => {
    const lower = (url + title).toLowerCase();
    if (lower.includes('hubcloud') || lower.includes('vcloud') || lower.includes('ncloud')) return 'N-Cloud'; // Preferred
    if (lower.includes('gdflix') || lower.includes('drive')) return 'GDFlix';
    if (lower.includes('pixel')) return 'PixelDrain';
    if (lower.includes('gdirect') || lower.includes('instant')) return 'G-Direct';
    return 'Cloud Server';
};

const isPreferred = (source: string) => source === 'N-Cloud' || source === 'G-Direct';

const parseEpisodeInfo = (filename: string) => {
  // Matches S01E01, 1x01, Episode 1
  const match = filename.match(/[sS](\d{1,2})[eE](\d{1,2})/) || 
                filename.match(/(\d{1,2})x(\d{1,2})/) ||
                filename.match(/(?:episode|ep)\s*(\d{1,2})/i);
  
  if (match) {
    // Agar regex S01E01 hai
    if (match.length === 3) return { season: parseInt(match[1]), episode: parseInt(match[2]) };
    // Agar regex Episode 1 hai
    if (match.length === 2) return { season: 1, episode: parseInt(match[1]) };
  }
  return null;
};

function VlyxDriveContent() {
  const params = useSearchParams();
  const router = useRouter();
  const key = params.get('key');
  
  const [status, setStatus] = useState('processing'); 
  const [metaData, setMetaData] = useState<any>(null);
  const [groupedEpisodes, setGroupedEpisodes] = useState<EpisodeGroup[]>([]);
  const [otherFiles, setOtherFiles] = useState<FileLink[]>([]);
  
  // State for toggling "Show More" servers per episode
  const [expandedEpisodes, setExpandedEpisodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (key) {
      const init = async () => {
        try {
          const json = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(json);
          setMetaData(payload);

          // Fetch Links
          const res = await fetch(`/api/resolve-link?url=${encodeURIComponent(payload.link)}`);
          const result = await res.json();
          
          if (result.success) {
             processFiles(result.items || [{title: 'Movie', link: result.url}]); // Handle single file too
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

  // --- Logic: Grouping ---
  const processFiles = (items: any[]) => {
      const groups: Record<number, EpisodeGroup> = {};
      const others: FileLink[] = [];

      items.forEach(item => {
          const info = parseEpisodeInfo(item.title);
          const source = getSourceName(item.link, item.title);
          const linkObj: FileLink = {
              title: item.title,
              url: item.link,
              source: source,
              isPreferred: isPreferred(source)
          };

          if (info) {
              const epNum = info.episode;
              if (!groups[epNum]) {
                  groups[epNum] = {
                      id: `ep-${epNum}`,
                      episodeNumber: epNum,
                      title: `Episode ${epNum}`,
                      links: []
                  };
              }
              groups[epNum].links.push(linkObj);
          } else {
              others.push(linkObj);
          }
      });

      // Sort Episodes
      const sortedGroups = Object.values(groups).sort((a, b) => a.episodeNumber - b.episodeNumber);
      
      // Sort Links inside Episodes (Preferred First)
      sortedGroups.forEach(g => {
          g.links.sort((a, b) => (a.isPreferred === b.isPreferred ? 0 : a.isPreferred ? -1 : 1));
      });

      setGroupedEpisodes(sortedGroups);
      setOtherFiles(others);
  };

  const toggleExpand = (id: string) => {
      setExpandedEpisodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePlay = (url: string) => {
    const nCloudKey = btoa(JSON.stringify({ url: url, title: "Stream" }))
       .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    router.push(`/ncloud?key=${nCloudKey}`);
  };

  // Color logic based on source
  const getButtonClass = (source: string) => {
      if (source === 'N-Cloud') return "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-yellow-400";
      if (source === 'GDFlix') return "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white";
      if (source === 'PixelDrain') return "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white";
      return "bg-gray-700 hover:bg-gray-600 text-gray-200";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 font-sans">
      <div className="max-w-4xl mx-auto animate-fade-in">
        
        {/* Header Card */}
        {metaData && (
          <div className="relative overflow-hidden bg-gray-900 rounded-3xl border border-gray-800 p-6 mb-8 shadow-2xl">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
             
             <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start">
                <img 
                  src={metaData.poster || '/placeholder.png'} 
                  className="w-32 h-48 object-cover rounded-xl shadow-lg border border-gray-700" 
                  alt="Poster" 
                />
                <div className="text-center md:text-left flex-1">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold mb-3 border border-blue-500/30">
                      <FolderOpen size={12} /> VLYX-DRIVE ACCESS
                   </div>
                   <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight">
                      {metaData.title}
                   </h1>
                   <p className="text-gray-400 text-sm md:text-base">
                      Secure File Manager • {groupedEpisodes.length + otherFiles.length} Files Found
                   </p>
                </div>
             </div>
          </div>
        )}

        {/* Loading State */}
        {status === 'processing' && (
           <div className="text-center py-20">
              <div className="relative w-16 h-16 mx-auto mb-4">
                 <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-400 animate-pulse">Scanning server directories...</p>
           </div>
        )}

        {/* Content List */}
        {status === 'ready' && (
           <div className="space-y-6">
              
              {/* Episodes List */}
              {groupedEpisodes.map((group) => {
                  const preferredLinks = group.links.filter(l => l.isPreferred);
                  const otherLinks = group.links.filter(l => !l.isPreferred);
                  const isExpanded = expandedEpisodes[group.id];

                  return (
                      <div key={group.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-all">
                          {/* Episode Title Row */}
                          <div className="bg-gray-800/40 px-6 py-4 flex items-center justify-between border-b border-gray-800">
                              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center text-sm font-bold">
                                      {group.episodeNumber}
                                  </div>
                                  {group.title}
                              </h3>
                              <span className="text-xs text-gray-500 bg-black/30 px-2 py-1 rounded">
                                  {group.links.length} Servers
                              </span>
                          </div>

                          {/* Links Area */}
                          <div className="p-6">
                              {/* Primary (Preferred) Links */}
                              <div className="space-y-3">
                                  {preferredLinks.map((link, idx) => (
                                      <button 
                                          key={`pref-${idx}`}
                                          onClick={() => handlePlay(link.url)}
                                          className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transform hover:scale-[1.02] transition-all ${getButtonClass(link.source)}`}
                                      >
                                          {link.source === 'N-Cloud' ? <CloudLightning size={20}/> : <Play size={20}/>}
                                          {link.source === 'N-Cloud' ? 'Continue with N-Cloud' : `Play via ${link.source}`}
                                          {link.isPreferred && <span className="text-xs bg-white/20 px-2 py-0.5 rounded ml-2">FAST</span>}
                                      </button>
                                  ))}
                              </div>

                              {/* Secondary Links (Collapsible) */}
                              {otherLinks.length > 0 && (
                                  <div className="mt-4">
                                      {!isExpanded && preferredLinks.length > 0 ? (
                                          <button 
                                              onClick={() => toggleExpand(group.id)}
                                              className="w-full py-2 text-sm text-gray-500 hover:text-white flex items-center justify-center gap-1 transition-colors"
                                          >
                                              <ChevronDown size={14} /> Show {otherLinks.length} more servers
                                          </button>
                                      ) : (
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 animate-fade-in">
                                              {otherLinks.map((link, idx) => (
                                                  <button 
                                                      key={`other-${idx}`}
                                                      onClick={() => handlePlay(link.url)}
                                                      className={`py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${getButtonClass(link.source)}`}
                                                  >
                                                      <Server size={16} /> {link.source}
                                                  </button>
                                              ))}
                                              {preferredLinks.length > 0 && (
                                                  <button 
                                                      onClick={() => toggleExpand(group.id)}
                                                      className="col-span-full py-2 text-sm text-gray-500 hover:text-white flex items-center justify-center gap-1"
                                                  >
                                                      <ChevronUp size={14} /> Show Less
                                                  </button>
                                              )}
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>
                      </div>
                  );
              })}

              {/* Other Files (Movies/Extras) */}
              {otherFiles.length > 0 && (
                  <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                      <h4 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
                          <HardDrive size={18} /> Other Files
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {otherFiles.map((file, idx) => (
                              <button 
                                  key={idx}
                                  onClick={() => handlePlay(file.url)}
                                  className="p-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-left transition-colors flex items-center justify-between group"
                              >
                                  <span className="font-medium text-gray-300 group-hover:text-white truncate pr-4">
                                      {file.title}
                                  </span>
                                  <Play size={16} className="text-gray-600 group-hover:text-blue-400" />
                              </button>
                          ))}
                      </div>
                  </div>
              )}

           </div>
        )}

        {/* Error State */}
        {status === 'error' && (
           <div className="text-center py-20">
              <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Link Expired or Invalid</h3>
              <p className="text-gray-400">The requested folder could not be accessed.</p>
           </div>
        )}
      </div>
    </div>
  );
}

export default function VlyxDrive() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">Loading...</div>}>
      <VlyxDriveContent />
    </Suspense>
  );
}
