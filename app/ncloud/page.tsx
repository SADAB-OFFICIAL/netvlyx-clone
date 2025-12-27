// app/ncloud/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Play, Download } from 'lucide-react';

function NCloudContent() {
  const params = useSearchParams();
  const key = params.get('key');
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (key) {
      const init = async () => {
        try {
          const json = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
          const data = JSON.parse(json);
          setStreamUrl(data.url); 
          setLoading(false);
        } catch (e) {
          console.error(e);
          setLoading(false);
        }
      };
      init();
    }
  }, [key]);

  const playInVLC = () => {
    if (!streamUrl) return;
    const intent = `intent://${streamUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=org.videolan.vlc;end`;
    window.location.href = intent;
  };

  if (loading) return <div className="text-white">Connecting to N-Cloud...</div>;

  return (
    <div className="w-full max-w-lg space-y-6">
      <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
        N-Cloud Player
      </h1>
      
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <p className="text-gray-400 text-center mb-6">Select a player to stream</p>
        
        <div className="space-y-3">
          <button 
            onClick={playInVLC}
            className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl transition-all"
          >
            <Play className="fill-current" /> Play in VLC
          </button>
          
          <a 
            href={streamUrl || '#'} 
            target="_blank"
            className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition-all"
          >
            <Download /> Direct Download
          </a>
        </div>
      </div>
    </div>
  );
}

// Main Page Component wrapping Content in Suspense
export default function NCloud() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <NCloudContent />
      </Suspense>
    </div>
  );
}
