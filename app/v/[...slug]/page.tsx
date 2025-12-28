// app/v/[...slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Play, HardDrive, Download, AlertCircle, 
  Film, CheckCircle, Server, ImageIcon, Settings, CloudLightning,
  Archive, Tv, ImageOff
} from 'lucide-react';

// ... (Types interface same as before) ...

export default function MoviePage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ... (Logic States: selectedSeason, actionType, etc. same as before) ...

  const movieUrl = slug 
    ? atob((slug as string[]).join('/').replace(/-/g, '+').replace(/_/g, '/')) 
    : '';

  useEffect(() => {
    if (!movieUrl) return;
    const fetchRealData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/movie-details?url=${encodeURIComponent(movieUrl)}`);
        if (!res.ok) throw new Error("Failed");
        const result = await res.json();
        setData(result);
        // ... (Season logic same as before) ...
      } catch (err) {
        setError("Content not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchRealData();
  }, [movieUrl]);

  // ... (Link Processing Logic same as before) ...

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (error) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-20 animate-fade-in font-sans">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110" style={{ backgroundImage: `url(${data?.poster || '/placeholder.png'})` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/80"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white bg-white/5 py-2 px-4 rounded-full border border-white/10">
          <ArrowLeft size={18} /> Back
        </button>
        
        <div className="flex flex-col lg:flex-row gap-10">
          {/* POSTER */}
          <div className="w-full lg:w-[320px] flex-shrink-0 mx-auto lg:mx-0">
             <img src={data?.poster} alt={data?.title} className="rounded-2xl shadow-2xl w-full border border-white/10" />
          </div>

          <div className="flex-1 min-w-0">
            {/* TITLE & INFO */}
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{data?.title}</h1>
            <p className="text-gray-400 text-lg mb-8 line-clamp-4">{data?.plot}</p>

            {/* --- SCREENSHOTS SECTION (UPDATED) --- */}
            <div className="mb-8 animate-fade-in">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                   <ImageIcon className="text-blue-500"/> Screenshots
                </h3>

                {data?.screenshots && data.screenshots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.screenshots.map((src: string, i: number) => (
                            <div key={i} className="group relative overflow-hidden rounded-xl border border-gray-800 bg-black aspect-video hover:border-blue-500/50 transition-colors">
                                <img 
                                   src={src} 
                                   className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300" 
                                   alt={`Screen ${i+1}`} 
                                   loading="lazy"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-12 text-center">
                        <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ImageOff className="w-10 h-10 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-300 mb-2">No Screenshots Available</h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                            We couldn't fetch preview images for this content. However, the quality is guaranteed as per the label.
                        </p>
                    </div>
                )}
            </div>

            {/* --- DOWNLOAD LOGIC CONTAINER --- */}
            <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl transition-all duration-300">
               {/* ... (Previous Download Steps UI Code) ... */}
               {/* Note: Paste the full download logic from previous response here */}
               <div className="text-center text-gray-500 py-8">Select Season/Action to load links...</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
