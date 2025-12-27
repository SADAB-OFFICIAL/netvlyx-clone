// app/vlyxdrive/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { CloudLightning, Loader2, Server, AlertTriangle, FolderOpen, FileVideo, Play } from 'lucide-react';

function VlyxDriveContent() {
  const params = useSearchParams();
  const router = useRouter();
  const key = params.get('key');
  
  const [status, setStatus] = useState('processing'); 
  const [data, setData] = useState<any>(null); // Stores either single URL or List
  const [originalLink, setOriginalLink] = useState('');

  useEffect(() => {
    if (key) {
      const processLink = async () => {
        try {
          const json = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
          const decoded = JSON.parse(json);
          setOriginalLink(decoded.link);

          // Call our Smart API
          const res = await fetch(`/api/resolve-link?url=${encodeURIComponent(decoded.link)}`);
          const result = await res.json();
          
          if (result.success) {
            setData(result); // result can be { type: 'file', url: '...' } OR { type: 'folder', items: [...] }
            setStatus('ready');
          } else {
            setStatus('error');
          }
        } catch (e) {
          setStatus('error');
        }
      };
      processLink();
    }
  }, [key]);

  // Handle click on an item in the list
  const handleItemClick = (url: string) => {
      // Jab user list mein se kisi episode par click kare, 
      // toh use dobara VlyxDrive par bhejo (Recursive) taaki wo file resolve ho jaye
      const newKey = btoa(JSON.stringify({ link: url, source: 'netvlyx' }))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      
      // Page reload karne ke bajaye state update kar sakte hain, par reload safe hai
      window.location.href = `/vlyxdrive?key=${newKey}`;
  };

  // Handle final file play
  const handlePlay = (url: string) => {
    const nCloudKey = btoa(JSON.stringify({ url: url, title: "Stream" }))
       .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    router.push(`/ncloud?key=${nCloudKey}`);
  };

  return (
    <div className="max-w-xl w-full bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-2xl animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="bg-blue-600/20 p-4 rounded-full mb-3">
          <CloudLightning className="w-10 h-10 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">Vlyx Drive</h2>
        <p className="text-gray-400 text-sm">Secure File Gateway</p>
      </div>
      
      {/* LOADING STATE */}
      {status === 'processing' && (
        <div className="text-center py-8">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Analyzing Link Type...</p>
        </div>
      )}

      {/* READY STATE */}
      {status === 'ready' && data && (
        <div className="space-y-4">
          
          {/* CASE 1: IT IS A FOLDER (EPISODE LIST) */}
          {data.type === 'folder' && (
             <div className="animate-slide-up">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <FolderOpen className="text-yellow-500" />
                    <h3 className="text-lg font-bold text-white">Episodes Found ({data.items.length})</h3>
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
                    {data.items.map((item: any, idx: number) => (
                        <button 
                           key={idx}
                           onClick={() => handleItemClick(item.link)}
                           className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 rounded-xl transition-all group text-left"
                        >
                           <div className="flex items-center gap-3 overflow-hidden">
                              <div className="bg-gray-900 p-2 rounded-lg text-gray-400 group-hover:text-blue-400">
                                 <FileVideo size={20} />
                              </div>
                              <span className="text-sm font-medium text-gray-200 group-hover:text-white truncate">
                                 {item.title}
                              </span>
                           </div>
                           <Play size={16} className="text-gray-500 group-hover:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
             </div>
          )}

          {/* CASE 2: IT IS A SINGLE FILE (READY TO PLAY) */}
          {data.type === 'file' && (
            <div className="animate-fade-in space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center gap-3">
                <Server className="text-green-500" size={24} />
                <div className="overflow-hidden">
                  <p className="text-xs text-green-400 font-bold uppercase">Ready to Stream</p>
                  <p className="text-sm text-gray-300 truncate w-full">Secure Connection Established</p>
                </div>
              </div>

              <button 
                onClick={() => handlePlay(data.url)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-105 flex items-center justify-center gap-2"
              >
                <Play className="fill-current" /> Play Now
              </button>
            </div>
          )}

        </div>
      )}

      {/* ERROR STATE */}
      {status === 'error' && (
        <div className="text-center py-4">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p className="text-red-400">Failed to resolve link.</p>
          <a href={originalLink} target="_blank" className="text-sm text-blue-400 underline mt-2 block">
            Open Original Link
          </a>
        </div>
      )}
    </div>
  );
}

export default function VlyxDrive() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <VlyxDriveContent />
      </Suspense>
    </div>
  );
}
