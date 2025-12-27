// app/v/[...slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Play, HardDrive, Download, AlertCircle } from 'lucide-react';

export default function MoviePage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. URL Decode Logic
  const movieUrl = slug ? atob((slug as string[]).join('/').replace(/-/g, '+').replace(/_/g, '/')) : '';

  // 2. Real Data Fetching
  useEffect(() => {
    if (!movieUrl) return;

    const fetchRealData = async () => {
      try {
        // Humare naye API ko call karein
        const res = await fetch(`/api/movie-details?url=${encodeURIComponent(movieUrl)}`);
        
        if (!res.ok) throw new Error("Failed to load movie data");
        
        const result = await res.json();
        
        // Agar links nahi mile to error dikhayein
        if (!result.downloadSections || result.downloadSections.length === 0) {
           // Agar scraping fail hoti hai, to fallback data rakhein taaki page khali na dikhe
           console.warn("No links found, checking fallback...");
        }

        setData(result);
      } catch (err) {
        console.error(err);
        setError("Failed to verify secure connection. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, [movieUrl]);

  // 3. VlyxDrive Redirect Logic
  const handleLinkClick = (url: string) => {
    const key = btoa(JSON.stringify({ link: url, source: 'netvlyx' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    router.push(`/vlyxdrive?key=${key}`);
  };

  // Loading Screen
  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 text-sm animate-pulse">Scraping secure links...</p>
    </div>
  );

  // Error Screen
  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-red-500">
      <div className="text-center">
        <AlertCircle className="mx-auto mb-2 h-10 w-10" />
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 bg-gray-800 px-4 py-2 rounded text-white">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 animate-fade-in pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800 py-2 px-4 rounded-lg transition-all"
        >
          <ArrowLeft size={20} /> Back to Home
        </button>
        
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Left: Poster */}
          <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
            <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-red-900/10 border border-gray-800">
              <img 
                src={data?.poster || '/placeholder.png'} 
                alt={data?.title} 
                className="w-full h-auto object-cover" 
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300x450?text=No+Poster')}
              />
            </div>
          </div>

          {/* Right: Details */}
          <div className="w-full md:w-2/3 lg:w-3/4">
            <h1 className="text-2xl md:text-4xl font-bold mb-4 text-white">
              {data?.title}
            </h1>
            
            {/* Plot */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 mb-8">
              <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                {data?.plot || "No description available for this content."}
              </p>
            </div>
            
            {/* Download Links Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-4">
                <Download className="text-red-500" /> 
                <h3 className="text-xl font-bold">Download Links</h3>
              </div>
              
              {data?.downloadSections && data.downloadSections.length > 0 ? (
                data.downloadSections.map((section: any, i: number) => (
                  <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800/50 hover:border-gray-700 transition-colors">
                    <h4 className="text-green-400 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      {section.title}
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {section.links.map((link: any, j: number) => (
                        <button 
                          key={j}
                          onClick={() => handleLinkClick(link.url)}
                          className="flex items-center gap-2 bg-gray-800 hover:bg-blue-600 text-white px-5 py-3 rounded-lg transition-all hover:shadow-lg hover:-translate-y-1 font-medium group text-sm border border-gray-700 hover:border-blue-500"
                        >
                          <HardDrive size={16} className="text-gray-400 group-hover:text-white" />
                          {link.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-gray-900 rounded-xl border border-dashed border-gray-700">
                   <p className="text-gray-400">Links are protected or not available via scraping.</p>
                   <a href={movieUrl} target="_blank" className="text-blue-400 hover:underline mt-2 block">
                     Open Source Page
                   </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
