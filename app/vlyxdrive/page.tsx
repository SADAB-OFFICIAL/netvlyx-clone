// app/vlyxdrive/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { CloudLightning, Loader2, Play, AlertTriangle, FolderOpen, Clock, Info } from 'lucide-react';

// --- Helper: Filename Parser ---
// Ye filename se S01E01 nikalta hai
const parseEpisodeInfo = (filename: string) => {
  const match = filename.match(/[sS](\d{1,2})[eE](\d{1,2})/);
  if (match) {
    return { season: parseInt(match[1]), episode: parseInt(match[2]) };
  }
  return null;
};

function VlyxDriveContent() {
  const params = useSearchParams();
  const router = useRouter();
  const key = params.get('key');
  
  const [status, setStatus] = useState('processing'); 
  const [folderData, setFolderData] = useState<any>(null); // List of files
  const [metaData, setMetaData] = useState<any>(null); // Show details passed from V-page
  const [episodes, setEpisodes] = useState<any[]>([]); // Final Merged List

  useEffect(() => {
    if (key) {
      const init = async () => {
        try {
          // 1. Decode Data
          const json = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
          const payload = JSON.parse(json);
          setMetaData(payload);

          // 2. Fetch Folder Links (Backend API)
          const res = await fetch(`/api/resolve-link?url=${encodeURIComponent(payload.link)}`);
          const result = await res.json();
          
          if (result.success) {
            if (result.type === 'folder') {
               // Agar folder hai, to process karo
               setFolderData(result);
               await enrichEpisodes(result.items, payload.title);
               setStatus('ready');
            } else {
               // Single file
               setFolderData(result);
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

  // --- MAGIC: Metadata Enricher ---
  // Ye function har file ko TMDB data se match karta hai
  const enrichEpisodes = async (items: any[], showTitle: string) => {
     // Real world mein hum yahan TMDB API call karte.
     // Abhi ke liye hum "Mock Data" generate karenge jo real lagta hai based on SxxEyy
     
     const enriched = items.map((item: any) => {
        const info = parseEpisodeInfo(item.title); // Filename se S1E1 nikalo
        
        if (info) {
           return {
              ...item,
              isEpisode: true,
              season: info.season,
              episode: info.episode,
              // Fake Metadata Generation (Real App mein ye API se aayega)
              epTitle: `Chapter ${info.episode}: The Saga Continues`,
              overview: `In season ${info.season}, episode ${info.episode}, the characters face a new challenge as the plot thickens...`,
              runtime: "45m",
              thumbnail: metaData?.poster // Fallback to show poster
           };
        } else {
           return { ...item, isEpisode: false };
        }
     });
     
     setEpisodes(enriched);
  };

  const handlePlay = (url: string) => {
    const nCloudKey = btoa(JSON.stringify({ url: url, title: "Stream" }))
       .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    router.push(`/ncloud?key=${nCloudKey}`);
  };

  return (
    <div className="max-w-4xl w-full mx-auto p-4 animate-fade-in text-white">
      
      {/* Header Info */}
      {metaData && (
        <div className="flex items-center gap-4 mb-8 bg-gray-900/80 p-6 rounded-2xl border border-gray-800">
           <img src={metaData.poster} className="w-16 h-24 object-cover rounded-lg shadow-lg" alt="Poster"/>
           <div>
              <h1 className="text-2xl font-bold">{metaData.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                 <FolderOpen size={16}/>
                 <span>Secure Drive Source</span>
              </div>
           </div>
        </div>
      )}
      
      {/* Loading */}
      {status === 'processing' && (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Syncing metadata & retrieving links...</p>
        </div>
      )}

      {/* Content List */}
      {status === 'ready' && (
        <div className="grid grid-cols-1 gap-4">
           {folderData?.type === 'folder' ? (
              episodes.map((ep, idx) => (
                 <div key={idx} className="bg-gray-800/40 border border-gray-700 hover:border-blue-500 rounded-xl overflow-hidden transition-all hover:bg-gray-800 group">
                    <div className="flex flex-col sm:flex-row gap-4 p-4">
                       {/* Thumbnail Area (Left) */}
                       <div className="relative w-full sm:w-48 h-28 bg-black flex-shrink-0 rounded-lg overflow-hidden">
                          <img src={ep.thumbnail || '/placeholder.png'} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <button onClick={() => handlePlay(ep.link)} className="bg-white/20 hover:bg-red-600 text-white p-3 rounded-full backdrop-blur-sm transition-all transform group-hover:scale-110">
                                <Play size={20} className="fill-current"/>
                             </button>
                          </div>
                          {ep.isEpisode && (
                             <div className="absolute bottom-2 right-2 bg-black/80 text-[10px] px-2 py-0.5 rounded text-white font-bold">
                                {ep.runtime}
                             </div>
                          )}
                       </div>

                       {/* Info Area (Right) */}
                       <div className="flex-1 flex flex-col justify-center">
                          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-1">
                             {ep.isEpisode ? `${ep.season}x${ep.episode} - ${ep.epTitle}` : ep.title}
                          </h3>
                          <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                             {ep.overview || "No description available for this file."}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                             <span className="bg-gray-700 px-2 py-1 rounded border border-gray-600">MKV / MP4</span>
                             {ep.isEpisode && <span>• Aired 2024</span>}
                          </div>
                       </div>
                    </div>
                 </div>
              ))
           ) : (
              // Single File View
              <div className="text-center py-10 bg-gray-900 rounded-xl border border-green-500/30">
                 <h2 className="text-xl font-bold text-green-400 mb-4">Ready to Stream</h2>
                 <button onClick={() => handlePlay(folderData.url)} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 mx-auto">
                    <Play className="fill-current" /> Play Movie
                 </button>
              </div>
           )}
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="text-center py-10 text-red-500">
           <AlertTriangle className="w-12 h-12 mx-auto mb-2"/>
           <p>Unable to load folder content.</p>
        </div>
      )}
    </div>
  );
}

export default function VlyxDrive() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <VlyxDriveContent />
      </Suspense>
    </div>
  );
}
