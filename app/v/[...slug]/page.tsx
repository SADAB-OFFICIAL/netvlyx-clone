// app/v/[...slug]/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Play, 
  HardDrive, 
  Download, 
  AlertCircle, 
  Calendar, 
  Star, 
  Film, 
  ImageIcon 
} from 'lucide-react';

export default function MoviePage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. URL Decode Logic
  const movieUrl = slug 
    ? atob((slug as string[]).join('/').replace(/-/g, '+').replace(/_/g, '/')) 
    : '';

  // 2. Real Data Fetching
  useEffect(() => {
    if (!movieUrl) return;

    const fetchRealData = async () => {
      try {
        setLoading(true);
        // Humare backend API ko call karein
        const res = await fetch(`/api/movie-details?url=${encodeURIComponent(movieUrl)}`);
        
        if (!res.ok) throw new Error("Failed to load movie data");
        
        const result = await res.json();
        
        // Agar result mein error ho
        if (result.error) throw new Error(result.error);

        setData(result);
      } catch (err) {
        console.error(err);
        setError("Failed to verify secure connection or content not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, [movieUrl]);

  // 3. VlyxDrive Redirect Logic
  const handleLinkClick = (url: string) => {
    // Link ko encode karke VlyxDrive bhejna
    const key = btoa(JSON.stringify({ link: url, source: 'netvlyx' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    router.push(`/vlyxdrive?key=${key}`);
  };

  // Loading Screen
  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Film className="w-6 h-6 text-red-600 animate-pulse" />
        </div>
      </div>
      <p className="text-gray-400 text-sm font-medium animate-pulse">Fetching secure details...</p>
    </div>
  );

  // Error Screen
  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-red-900/50 rounded-2xl p-8 text-center">
        <div className="bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => router.back()} 
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
          >
            Go Back
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-20 animate-fade-in">
      {/* Background Backdrop Effect */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110"
          style={{ backgroundImage: `url(${data?.poster || '/placeholder.png'})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/60"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-md py-2 px-4 rounded-full transition-all border border-white/10"
        >
          <ArrowLeft size={18} /> 
          <span className="text-sm font-medium">Back to Home</span>
        </button>
        
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          {/* Left Column: Poster */}
          <div className="w-full lg:w-[350px] flex-shrink-0 mx-auto lg:mx-0">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl bg-gray-900 ring-1 ring-white/10">
                <img 
                  src={data?.poster || '/placeholder.png'} 
                  alt={data?.title} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                  onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300x450?text=No+Poster')}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 bg-white text-black font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors">
                <Play size={20} className="fill-current" /> Watch
              </button>
              <button 
                onClick={() => document.getElementById('download-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center justify-center gap-2 bg-gray-800/80 backdrop-blur-md text-white font-semibold py-3 px-4 rounded-xl border border-white/10 hover:bg-gray-700 transition-colors"
              >
                <Download size={20} /> Download
              </button>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="flex-1 min-w-0">
            {/* Title & Meta */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {data?.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-8 text-sm sm:text-base text-gray-300">
              <span className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20">
                <Star size={16} className="fill-current" />
                <span className="font-bold">8.5</span>
              </span>
              <span className="flex items-center gap-1.5 bg-gray-800/50 px-3 py-1 rounded-full border border-white/10">
                <Calendar size={16} />
                <span>2024-25</span>
              </span>
              <span className="flex items-center gap-1.5 bg-gray-800/50 px-3 py-1 rounded-full border border-white/10">
                <Film size={16} />
                <span>Movie / Series</span>
              </span>
            </div>

            {/* Plot */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-white mb-3">Synopsis</h3>
              <p className="text-gray-400 leading-relaxed text-lg font-light">
                {data?.plot || "No description available for this content."}
              </p>
            </div>

            {/* Screenshots Gallery */}
            {data?.screenshots && data.screenshots.length > 0 && (
              <div className="mb-10 animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="text-blue-500" size={20} />
                  <h3 className="text-xl font-bold text-white">Screenshots</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {data.screenshots.map((src: string, i: number) => (
                    <div 
                      key={i} 
                      className="group relative aspect-video rounded-lg overflow-hidden border border-gray-800 bg-gray-900 cursor-pointer"
                    >
                      <img 
                        src={src} 
                        alt={`Scene ${i+1}`} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Download Section */}
            <div id="download-section" className="space-y-6 pt-6 border-t border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="text-red-500" size={24} />
                <h3 className="text-2xl font-bold text-white">Download Links</h3>
              </div>

              {data?.downloadSections && data.downloadSections.length > 0 ? (
                data.downloadSections.map((section: any, i: number) => (
                  <div key={i} className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300">
                    <h4 className="text-green-400 font-bold mb-4 flex items-center gap-3 text-sm uppercase tracking-wider">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      {section.title}
                    </h4>
                    
                    <div className="flex flex-wrap gap-3">
                      {section.links.map((link: any, j: number) => (
                        <button 
                          key={j}
                          onClick={() => handleLinkClick(link.url)}
                          className="group relative flex items-center gap-3 bg-gray-800 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 text-gray-300 hover:text-white px-6 py-3.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20 hover:-translate-y-0.5 border border-gray-700 hover:border-transparent w-full sm:w-auto"
                        >
                          <HardDrive size={18} className="text-gray-500 group-hover:text-white transition-colors" />
                          <span className="font-medium">{link.label}</span>
                          <span className="ml-auto sm:ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowLeft size={16} className="rotate-180" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-900/30 rounded-2xl border border-dashed border-gray-800">
                   <HardDrive className="w-12 h-12 text-gray-700 mb-4" />
                   <p className="text-gray-400 font-medium">Links are protected or not available via scraping.</p>
                   <a 
                     href={movieUrl} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="mt-4 text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-2"
                   >
                     Open Source Page <ArrowLeft size={16} className="rotate-180" />
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
