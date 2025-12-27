// app/vlyxdrive/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { CloudLightning, Loader2, Server, AlertTriangle } from 'lucide-react';

function VlyxDriveContent() {
  const params = useSearchParams();
  const router = useRouter();
  const key = params.get('key');
  
  const [status, setStatus] = useState('processing'); // processing, ready, error
  const [resolvedLink, setResolvedLink] = useState('');
  const [originalLink, setOriginalLink] = useState('');

  useEffect(() => {
    if (key) {
      const processLink = async () => {
        try {
          // 1. Decode Key
          const json = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
          const data = JSON.parse(json);
          setOriginalLink(data.link);

          // 2. Resolve Link (Intermediate Scraper Call)
          // Agar link direct HubCloud hai to skip karo, agar m4ulinks hai to resolve karo
          if (data.link.includes('hubcloud') || data.link.includes('vcloud')) {
            setResolvedLink(data.link);
            setStatus('ready');
          } else {
            const res = await fetch(`/api/resolve-link?url=${encodeURIComponent(data.link)}`);
            const result = await res.json();
            
            if (result.success) {
              setResolvedLink(result.url);
              setStatus('ready');
            } else {
              console.error("Link Resolution Failed");
              setStatus('error');
            }
          }
        } catch (e) {
          setStatus('error');
        }
      };
      processLink();
    }
  }, [key]);

  const handleContinue = () => {
    if (!resolvedLink) return;
    
    // Ab hum asli Resolved Link bhej rahe hain N-Cloud ko
    const nCloudKey = btoa(JSON.stringify({
      url: resolvedLink,
      title: "Stream Content"
    })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    router.push(`/ncloud?key=${nCloudKey}`);
  };

  return (
    <div className="max-w-md w-full bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 shadow-2xl">
      <div className="flex justify-center mb-6">
        <div className="bg-blue-600/20 p-4 rounded-full">
          <CloudLightning className="w-12 h-12 text-blue-500" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-center mb-2 text-white">Vlyx Drive</h2>
      
      {status === 'processing' && (
        <div className="text-center py-6">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Resolving secure server...</p>
        </div>
      )}

      {status === 'ready' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center gap-3">
            <Server className="text-green-500" size={24} />
            <div className="overflow-hidden">
              <p className="text-xs text-green-400 font-bold uppercase">Server Ready</p>
              <p className="text-sm text-gray-300 truncate w-full">N-Cloud / HubCloud</p>
            </div>
          </div>

          <button 
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition hover:scale-105"
          >
            Continue with N-Cloud
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-4">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p className="text-red-400">Failed to resolve server.</p>
          <a href={originalLink} target="_blank" className="text-sm text-blue-400 underline mt-2 block">
            Try opening original link
          </a>
        </div>
      )}
    </div>
  );
}

export default function VlyxDrive() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <VlyxDriveContent />
      </Suspense>
    </div>
  );
}
