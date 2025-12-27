// app/vlyxdrive/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { CloudLightning, Loader2, Play, AlertTriangle, FolderOpen, HardDrive, Server } from 'lucide-react';

// --- Helper: Filename Parser for Grouping ---
const parseEpisodeInfo = (filename: string) => {
  // Matches S01E01, S1E1, 1x01 formats
  const match = filename.match(/[sS](\d{1,2})[eE](\d{1,2})/) || filename.match(/(\d{1,2})x(\d{1,2})/);
  if (match) {
    return { 
        id: `S${parseInt(match[1])}E${parseInt(match[2])}`, // Unique ID like S1E1
        season: parseInt(match[1]), 
        episode: parseInt(match[2]) 
    };
  }
  return null;
};

// --- Helper: Get Source Name from URL ---
const getSourceName = (url: string, title: string) => {
    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();
    
    if (lowerUrl.includes('hubcloud') || lowerTitle.includes('hub')) return 'HubCloud';
    if (lowerUrl.includes('gdflix') || lowerTitle.includes('gd')) return 'GDFlix';
    if (lowerUrl.includes('drive') || lowerTitle.includes('drive')) return 'G-Drive';
    if (lowerUrl.includes('pixel') || lowerTitle.includes('pixel')) return 'PixelDrain';
    return 'Server'; // Fallback
};

function VlyxDriveContent() {
  const params = useSearchParams();
  const router = useRouter();
  const key = params.get('key');
  
  const [status, setStatus] = useState('processing'); 
  const [metaData, setMetaData] = useState<any>(null);
  const [groupedEpisodes, setGroupedEpisodes] = useState<any[]>([]); 
  const [singleFile, setSingleFile] = useState<any>(null);

  useEffect(() => {
    if (key) {
      const init = async () => {
        try {
          // 1. Decode Data
          const json = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(json);
          setMetaData(payload);

          // 2. Fetch Folder Links
          const res = await fetch(`/api/resolve-link?url=${encodeURIComponent(payload.link)}`);
          const result = await res.json();
          
          if (result.success) {
            if (result.type === 'folder') {
               processEpisodes(result.items);
               setStatus('ready');
            } else {
               setSingleFile(result);
               setStatus('ready');
            }
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

  // --- LOGIC: Group Links by Episode ---
  const processEpisodes = (items: any[]) => {
     const groups: Record<string, any> = {};
     const others: any[] = [];

     items.forEach(item => {
        const info = parseEpisodeInfo(item.title);
        
        if (info) {
            // Agar Episode hai, to Group mein daalo
            if (!groups[info.id]) {
                groups[info.id] = {
                    id: info.id,
                    title: `Episode ${info.episode}`,
                    season: info.season,
                    episode: info.episode,
                    links: []
                };
            }
            // Link ko clean naam dekar add karo
            groups[info.id].links.push({
                url: item.link,
                source: getSourceName(item.link, item.title),
                originalTitle: item.title
            });
        } else {
            // Agar S01E01 nahi mila, to 'Others' mein daalo
            others.push({
                title: item.title,
                url: item.link,
                source: getSourceName(item.link, item.title)
            });
        }
     });

     // Object ko Array mein convert karo aur Sort karo (Ep 1, 2, 3...)
     const sortedGroups = Object.values(groups).sort((a: any, b: any) => a.episode - b.episode);
     
     // Others ko bhi last mein add kar do agar kuch bacha ho
     if (others.length > 0) {
         setGroupedEpisodes([...sortedGroups, { id: 'others', title: 'Extras / Movies', links: others.map(o => ({...o, isExtra: true})) }]);
     } else {
         setGroupedEpisodes(sortedGroups);
     }
  };

  const handlePlay = (url: string) => {
    const nCloudKey = btoa(JSON.stringify({ url: url, title: "Stream" }))
       .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    router.push(`/ncloud?key=${nCloudKey}`);
  };

  return (
    <div className="max-w-3xl w-full mx-auto p-4 animate-fade-in text-white font-sans">
      
      {/* Header */}
      {metaData && (
        <div className="flex items-center gap-4 mb-6 bg-gray-900/90 p-5 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-md">
           <img 
             src={metaData.poster || '/placeholder.png'} 
             className="w-14 h-20 object-cover rounded-lg shadow-md border border-gray-700" 
             alt="Poster"
             onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/100x150?text=IMG')}
           />
           <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">{metaData.title}</h1>
              <div className="flex items-center gap-2 text-xs md:text-sm text-blue-400 mt-1 font-medium">
                 <FolderOpen size={14}/>
                 <span>File Manager</span>
                 <span className="text-gray-500">•</span>
                 <span className="text-gray-400">{groupedEpisodes.length > 0 ? `${groupedEpisodes.length} Episodes` : 'Loading...'}</span>
              </div>
           </div>
        </div>
      )}
      
      {/* Loading */}
      {status === 'processing' && (
        <div className="text-center py-12">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Organizing files...</p>
        </div>
      )}

      {/* Content List */}
      {status === 'ready' && (
        <div className="space-y-3">
           {singleFile ? (
              // Single File View
              <div className="bg-gray-900 border border-green-500/30 p-6 rounded-2xl text-center">
                 <h2 className="text-lg font-bold text-green-400 mb-4">File Ready</h2>
                 <button onClick={() => handlePlay(singleFile.url)} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold inline-flex items-center gap-2 transition-transform hover:scale-105">
                    <Play size={20} className="fill-current" /> Stream Now
                 </button>
              </div>
           ) : (
              // Grouped Episode List
              groupedEpisodes.map((ep: any) => (
                 <div key={ep.id} className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
                    {/* Episode Header */}
                    <div className="bg-gray-800/50 px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                       <h3 className="font-bold text-gray-200 flex items-center gap-2">
                          <Play size={16} className="text-blue-500 fill-blue-500/20" />
                          {ep.title}
                       </h3>
                       {!ep.isExtra && <span className="text-xs font-mono text-gray-500 bg-black/30 px-2 py-0.5 rounded">S{ep.season} E{ep.episode}</span>}
                    </div>

                    {/* Links Row */}
                    <div className="p-4 flex flex-wrap gap-3">
                       {ep.links.map((link: any, idx: number) => (
                          <button 
                             key={idx}
                             onClick={() => handlePlay(link.url)}
                             className={`
                                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-lg
                                ${link.source === 'HubCloud' 
                                   ? 'bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-600/30' 
                                   : link.source === 'GDFlix'
                                     ? 'bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border border-green-600/30'
                                     : 'bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-600/30'}
                             `}
                          >
                             {link.source === 'HubCloud' ? <CloudLightning size={16}/> : 
                              link.source === 'GDFlix' ? <HardDrive size={16}/> : <Server size={16}/>}
                             {link.source}
                          </button>
                       ))}
                    </div>
                 </div>
              ))
           )}
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="text-center py-10 bg-gray-900/50 rounded-2xl border border-red-900/30">
           <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2"/>
           <p className="text-gray-400">Links expired or unavailable.</p>
        </div>
      )}
    </div>
  );
}

export default function VlyxDrive() {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}>
        <VlyxDriveContent />
      </Suspense>
    </div>
  );
}
