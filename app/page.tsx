// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Play, Info, Search, Bell, CloudLightning, 
  ChevronRight, Star, Loader2 
} from 'lucide-react';

interface ContentItem {
  title: string;
  poster: string;
  rating: string;
  link: string;
}

interface HomeData {
  featured: {
    title: string;
    desc: string;
    poster: string;
    backdrop: string;
    tags: string[];
    rating: string;
    link: string;
  };
  sections: {
    title: string;
    items: ContentItem[];
  }[];
}

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Navbar Scroll Effect
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // Call Our Scraper API
    const fetchHome = async () => {
      try {
        const res = await fetch('/api/home');
        const result = await res.json();
        
        if (result.success && result.data) {
           setData(result.data);
        } else {
           console.error("No data found");
        }
      } catch (e) {
        console.error("Fetch Error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHome();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openLink = (link: string) => {
    // Link ko encode karke V-Page par bhejo
    const encoded = btoa(link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    router.push(`/v/${encoded}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
       <div className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent mb-4"></div>
       <p className="animate-pulse text-gray-400">Loading Latest Content...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-600/30">
      
      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 px-4 md:px-12 py-4 flex items-center justify-between ${scrolled ? 'bg-[#0a0a0a]/90 backdrop-blur-md shadow-lg border-b border-white/5' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
         <div className="flex items-center gap-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-400 tracking-tighter flex items-center gap-1 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
               <CloudLightning size={24} className="text-blue-500 fill-current" /> NetVlyx
            </h1>
            <ul className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
               <li className="text-white font-bold cursor-pointer">Home</li>
               <li className="cursor-pointer hover:text-white transition">TV Shows</li>
               <li className="cursor-pointer hover:text-white transition">Movies</li>
               <li className="cursor-pointer hover:text-white transition">My List</li>
            </ul>
         </div>

         <div className="flex items-center gap-5 text-gray-300">
            <Search className="w-5 h-5 cursor-pointer hover:text-white transition" />
            <Bell className="w-5 h-5 cursor-pointer hover:text-white transition hidden sm:block" />
            <div className="w-8 h-8 rounded bg-gradient-to-r from-blue-600 to-green-500 flex items-center justify-center font-bold text-xs text-white">
               U
            </div>
         </div>
      </nav>

      {/* HERO SECTION */}
      {data?.featured && (
         <div className="relative w-full h-[80vh] md:h-[95vh]">
            <div className="absolute inset-0">
               <img src={data.featured.backdrop || data.featured.poster} className="w-full h-full object-cover" alt="Hero" />
               <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent"></div>
            </div>

            <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-4 md:px-12 max-w-2xl">
               <div className="flex items-center gap-3 mb-4 animate-fade-in">
                  <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                     <Star size={10} className="fill-black"/> IMDb {data.featured.rating}
                  </span>
                  {data.featured.tags?.map((tag, i) => (
                     <span key={i} className="text-gray-200 text-sm font-medium border border-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">{tag}</span>
                  ))}
               </div>

               <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight drop-shadow-2xl animate-slide-up">
                  {data.featured.title}
               </h1>

               <p className="text-gray-300 text-sm md:text-base mb-8 line-clamp-3 drop-shadow-md animate-slide-up delay-100">
                  {data.featured.desc || "Watch the latest hit movies and series directly on NetVlyx without any ads. Premium experience for free."}
               </p>

               <div className="flex items-center gap-4 animate-slide-up delay-200">
                  <button 
                     onClick={() => openLink(data.featured.link)}
                     className="bg-white text-black px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-200 transition-all transform hover:scale-105 shadow-lg shadow-white/10"
                  >
                     <Play className="fill-current" size={24} /> Play
                  </button>
                  <button className="bg-gray-500/40 backdrop-blur-md text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-500/60 transition-all">
                     <Info size={24} /> More Info
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* CONTENT ROWS */}
      <div className="relative z-20 -mt-24 md:-mt-32 pb-20 space-y-12 px-4 md:px-12">
         {data?.sections.map((section, idx) => (
            section.items.length > 0 && (
                <div key={idx} className="space-y-4">
                   <h2 className="text-lg md:text-xl font-bold text-gray-100 flex items-center gap-2 hover:text-blue-400 transition-colors cursor-pointer group">
                      {section.title}
                      <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">Explore All <ChevronRight size={14}/></span>
                   </h2>
                   
                   <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide scroll-smooth">
                      {section.items.map((item, i) => (
                         <div 
                            key={i} 
                            onClick={() => openLink(item.link)}
                            className="group relative flex-shrink-0 w-[140px] md:w-[220px] cursor-pointer transition-all duration-300 hover:z-30 hover:scale-105"
                         >
                            <div className="aspect-[2/3] rounded-lg overflow-hidden border border-gray-800 shadow-lg relative bg-gray-900">
                               <img 
                                  src={item.poster} 
                                  alt={item.title} 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:contrast-110" 
                                  loading="lazy"
                               />
                               {/* Hover Play Button */}
                               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                   <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                       <Play className="fill-white text-white ml-1" size={24} />
                                   </div>
                               </div>
                               {/* Rating Badge */}
                               {item.rating && (
                                   <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-[10px] font-bold px-1.5 py-0.5 rounded text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
                                      <Star size={8} className="fill-yellow-400"/> {item.rating}
                                   </div>
                               )}
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-gray-400 group-hover:text-white truncate transition-colors">
                               {item.title}
                            </h3>
                         </div>
                      ))}
                   </div>
                </div>
            )
         ))}
      </div>

      {/* FOOTER */}
      <footer className="py-16 border-t border-gray-900 bg-black text-center">
         <div className="flex justify-center gap-6 mb-8 text-gray-500">
            <CloudLightning size={24} className="text-blue-600"/>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-sm text-gray-500 mb-8">
            <span className="hover:underline cursor-pointer">FAQ</span>
            <span className="hover:underline cursor-pointer">Help Center</span>
            <span className="hover:underline cursor-pointer">Terms of Use</span>
            <span className="hover:underline cursor-pointer">Privacy</span>
         </div>
         <p className="text-gray-600 text-xs">© 2024 NetVlyx Inc. Created for Educational Purpose.</p>
      </footer>

    </div>
  );
}
