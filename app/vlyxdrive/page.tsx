// app/vlyxdrive/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CloudLightning, Server } from 'lucide-react';

export default function VlyxDrive() {
  const params = useSearchParams();
  const router = useRouter();
  const key = params.get('key');
  const [decodedData, setDecodedData] = useState<any>(null);

  useEffect(() => {
    if (key) {
      try {
        const json = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
        setDecodedData(JSON.parse(json));
      } catch (e) {
        console.error("Invalid Key");
      }
    }
  }, [key]);

  const handleContinue = () => {
    if (!decodedData) return;
    
    // Yahan hum dobara encode karke N-Cloud ko bhejte hain
    const nCloudKey = btoa(JSON.stringify({
      url: decodedData.link,
      title: "Stream Content"
    })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    router.push(`/ncloud?key=${nCloudKey}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600/20 p-4 rounded-full animate-pulse">
            <CloudLightning className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2">Vlyx Drive</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">Secure Link Processor</p>

        {decodedData ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center gap-3">
              <Server className="text-green-500" size={20} />
              <div>
                <p className="text-xs text-green-400 font-bold uppercase">Server Found</p>
                <p className="text-sm text-gray-300 truncate w-60">{decodedData.link}</p>
              </div>
            </div>

            <button 
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-105"
            >
              Continue with N-Cloud
            </button>
          </div>
        ) : (
          <p className="text-center text-red-500">Invalid Link or Key</p>
        )}
      </div>
    </div>
  );
}
