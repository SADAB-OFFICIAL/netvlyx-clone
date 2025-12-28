// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, Info, Search, Bell, CloudLightning, 
  ChevronRight, Star, Loader2 
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // --- 1. Fetch Real Data from our API ---
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const fetchData = async () => {
      try {
        const res = await fetch('/api/home');
        const result = await res.json();
        if (result.success && result.data) {
           setData(result.data);
        }
      } catch (e) {
        console.error("Home Page Error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- 2. Auto-rotate Hero Slider ---
  useEffect(() => {
    if (!data?.featured?.length) return;
    const interval = setInterval(() => {
        setHeroIndex((prev) => (prev + 1) % data.featured.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [data]);

  // --- 3. Link Handling (To V-Page) ---
  const openLink = (rawUrl: string) => {
    if (!rawUrl) return;
    // Encode URL securely for the V-page route
    const encoded = btoa(rawUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    router.push(`/v/${encoded}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
       <div className="w-16 h-16 border-4 border-red-600 rounded-full animate-spin border-t-transparent mb-4"></div>
       <p className="animate-pulse text-gray-400 font-medium">Connecting to Movies4u...</p>
    </div>
  );

  const currentHero = data?.featured?.[heroIndex];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-red-500/30 pb-20">
      
      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 px-4 md:px-12 py-4 flex items-center justify-between ${scrolled ? 'bg-black/90 backdrop-blur-md shadow-lg border-b border-white/5' : 'bg-gradient-to-b from-black/90 to-transparent'}`}>
         <div className="flex items-center gap-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500 tracking-tighter cursor-pointer flex items-center gap-1" onClick={() => window.scrollTo(0,0)}>
               <CloudLightning className="text-red-600 fill-current" size={24}/> NETVLYX
            </h1>
            <ul className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
               <li className="text-white font-bold cursor-pointer">Home</li>
               <li className="cursor-pointer hover:text-white transition">TV Shows</li>
               <li className="cursor-pointer hover:text-white transition">Movies</li>
               <li className="cursor-pointer hover:text-white transition">Latest</li>
            </ul>
         </div>
         <div className="flex items-center gap-5 text-gray-300">
            <Search className="w-5 h-5 cursor-pointer hover:text-white transition" />
            <Bell className="w-5 h-5 cursor-pointer hover:text-white transition" />
            <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-xs text-white shadow-lg">U</div>
         </div>
      </nav>

      {/* HERO SLIDER */}
      {currentHero && (
         <div className="relative w-full h-[80vh] md:h-[95vh] overflow-hidden group">
            <div className="absolute inset-0">
               <div 
                 className="w-full h-full bg-cover bg-center transition-all duration-[2000ms] transform scale-105 group-hover:scale-100"
                 style={{ backgroundImage: `url(${currentHero.poster})` }}
               ></div>
               <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/10 to-transparent"></div>
            </div>

            <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-4 md:px-12 max-w-3xl">
               <div className="flex items-center gap-3 mb-4 animate-fade-in">
                  <span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-900/20">
                     {currentHero.tags?.[0] || 'Featured'}
                  </span>
                  <span className="text-green-400 font-bold text-sm flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
                     <Star size={12} className="fill-current"/> {currentHero.rating} IMDb
                  </span>
               </div>

               <h1 className="text-4xl md:text-7xl font-black mb-4 leading-none drop-shadow-2xl animate-slide-up text-white">
                  {currentHero.title}
               </h1>

               <p className="text-gray-200 text-sm md:text-lg mb-8 line-clamp-3 drop-shadow-md animate-slide-up delay-100 max-w-xl leading-relaxed">
                  {currentHero.desc || "Stream the latest blockbusters and exclusive series. Experience cinema-quality entertainment directly on your device."}
               </p>

               <div className="flex items-center gap-4 animate-slide-up delay-200">
                  <button 
                     onClick={() => openLink(currentHero.link)}
                     className="bg-white text-black px-8 py-3.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-200 transition-all transform hover:scale-105 shadow-xl shadow-white/10"
                  >
                     <Play className="fill-current" size={24} /> Play Now
                  </button>
                  <button className="bg-gray-600/40 text-white px-8 py-3.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-600/60 transition-all backdrop-blur-md border border-white/10">
                     <Info size={24} /> More Info
                  </button>
               </div>
            </div>

            {/* Slider Indicators */}
            <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-20">
                {data.featured.map((_: any, idx: number) => (
                    <div 
                        key={idx}
                        onClick={() => setHeroIndex(idx)}
                        className={`w-1.5 rounded-full cursor-pointer transition-all duration-500 ${idx === heroIndex ? 'bg-white h-10 shadow-[0_0_10px_white]' : 'bg-white/20 h-2 hover:bg-white/50'}`}
                    ></div>
                ))}
            </div>
         </div>
      )}

      {/* CONTENT SECTIONS */}
      <div className="relative z-20 -mt-20 md:-mt-32 space-y-10 px-4 md:px-12">
         {data?.sections?.map((section: any, idx: number) => (
            section.items.length > 0 && (
                <div key={idx} className="space-y-4">
                   <div className="flex items-center justify-between group cursor-pointer">
                       <h2 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-red-600 rounded-full"></div>
                          {section.title}
                       </h2>
                       <span className="text-xs font-semibold text-gray-400 group-hover:text-white transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 duration-300">
                           View All <ChevronRight size={14}/>
                       </span>
                   </div>
                   
                   {/* Horizontal Scroll Row */}
                   <div className="relative group/row">
                       <div className="flex gap-4 overflow-x-auto pb-8 pt-2 scrollbar-hide scroll-smooth px-1">
                          {section.items.map((item: any, i: number) => (
                             <div 
                                key={i} 
                                onClick={() => openLink(item.link)}
                                className="group relative flex-shrink-0 w-[140px] md:w-[220px] cursor-pointer transition-all duration-300 hover:z-30 hover:scale-110 hover:-translate-y-2"
                             >
                                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 shadow-lg relative border border-white/5">
                                   <img 
                                      src={item.poster} 
                                      alt={item.title} 
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:contrast-110" 
                                      loading="lazy"
                                   />
                                   
                                   {/* Hover Overlay */}
                                   <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                       <div className="flex items-center gap-2 mb-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                           <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                               <Play className="fill-black text-black ml-1" size={16}/>
                                           </div>
                                           <div className="w-10 h-10 rounded-full border-2 border-gray-500 flex items-center justify-center hover:border-white transition-colors">
                                               <Info className="text-white" size={20}/>
                                           </div>
                                       </div>
                                       
                                       <h3 className="text-sm font-bold text-white leading-tight mb-1 line-clamp-2">
                                           {item.title}
                                       </h3>
                                       
                                       <div className="flex items-center gap-2 text-[10px] text-gray-300">
                                           <span className="text-green-400 font-bold">{item.rating || 'N/A'}</span>
                                           <span>•</span>
                                           <span className="border border-gray-600 px-1 rounded">{item.quality}</span>
                                       </div>
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                   </div>
                </div>
            )
         ))}
      </div>

      {/* FOOTER */}
      <footer className="mt-12 py-16 bg-black text-center border-t border-gray-900">
         <div className="flex justify-center gap-6 mb-8 opacity-50 hover:opacity-100 transition-opacity">
            <CloudLightning size={32} className="text-red-600"/>
         </div>
         <p className="text-gray-500 text-sm mb-6">Questions? Contact us at support@netvlyx.com</p>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-xs text-gray-500 mb-8">
            <span className="hover:underline cursor-pointer">FAQ</span>
            <span className="hover:underline cursor-pointer">Investor Relations</span>
            <span className="hover:underline cursor-pointer">Privacy</span>
            <span className="hover:underline cursor-pointer">Speed Test</span>
            <span className="hover:underline cursor-pointer">Help Center</span>
            <span className="hover:underline cursor-pointer">Jobs</span>
            <span className="hover:underline cursor-pointer">Cookie Preferences</span>
            <span className="hover:underline cursor-pointer">Legal Notices</span>
         </div>
         <p className="text-gray-600 text-xs">© 2024 NetVlyx India. Content scraped from public sources.</p>
      </footer>

    </div>
  );
}
