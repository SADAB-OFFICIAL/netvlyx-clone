'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Play, Info, Search, Bell, MonitorPlay, 
  ChevronRight, Star, Loader2, X, 
  Globe, Mail, Instagram 
} from 'lucide-react';

// ✅ Import Stars Component
import TwinklingStars from '@/components/TwinklingStars';

// --- SKELETON COMPONENTS ---
const HeroSkeleton = () => (
  <div className="w-full h-[85vh] bg-gray-900/50 animate-pulse relative">
      <div className="absolute bottom-0 left-0 p-12 w-full max-w-3xl space-y-4">
          <div className="h-12 w-3/4 bg-gray-800 rounded-lg"></div>
          <div className="h-4 w-full bg-gray-800 rounded"></div>
          <div className="h-4 w-2/3 bg-gray-800 rounded"></div>
          <div className="flex gap-4 pt-4">
              <div className="h-12 w-32 bg-gray-800 rounded-lg"></div>
              <div className="h-12 w-32 bg-gray-800 rounded-lg"></div>
          </div>
      </div>
  </div>
);

const SectionSkeleton = () => (
  <div className="px-12 mb-12 space-y-4">
      <div className="h-6 w-48 bg-gray-800 rounded animate-pulse"></div>
      <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="min-w-[200px] h-[300px] bg-gray-800 rounded-lg animate-pulse"></div>
          ))}
      </div>
  </div>
);

const NavbarSkeleton = () => (
  <div className="h-20 w-full bg-gray-900/80 border-b border-gray-800 flex items-center justify-between px-12 animate-pulse">
      <div className="h-8 w-24 bg-gray-800 rounded"></div>
      <div className="flex gap-6">
          <div className="h-6 w-16 bg-gray-800 rounded"></div>
          <div className="h-6 w-16 bg-gray-800 rounded"></div>
          <div className="h-6 w-16 bg-gray-800 rounded"></div>
      </div>
      <div className="flex gap-4">
          <div className="h-8 w-8 bg-gray-800 rounded-full"></div>
          <div className="h-8 w-8 bg-gray-800 rounded-full"></div>
      </div>
  </div>
);

// --- NAVBAR COMPONENT ---
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setSearchOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
      scrolled ? 'bg-[#0a0a0a]/90 backdrop-blur-md shadow-2xl' : 'bg-transparent'
    }`}>
      <div className="px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-12">
           {/* LOGO */}
           <div className="flex items-center gap-2 cursor-pointer group" onClick={() => router.push('/')}>
              <MonitorPlay className="text-purple-500 group-hover:scale-110 transition-transform" size={32} />
              <span className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                NETVLYX
              </span>
           </div>

           {/* DESKTOP LINKS */}
           <div className="hidden md:flex gap-8 text-sm font-medium text-gray-300">
              {['Home', 'Series', 'Movies', 'New & Popular', 'My List'].map((item) => (
                <span key={item} className="hover:text-white transition-colors cursor-pointer hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                  {item}
                </span>
              ))}
           </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-6">
           {searchOpen ? (
             <form onSubmit={handleSearch} className="relative">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Titles, people, genres" 
                  className="bg-black/80 border border-gray-600 pl-4 pr-10 py-2 rounded-full text-sm w-64 focus:outline-none focus:border-purple-500 transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => !query && setSearchOpen(false)}
                />
                <X 
                  size={16} 
                  className="absolute right-3 top-2.5 text-gray-400 cursor-pointer hover:text-white"
                  onClick={() => setSearchOpen(false)} 
                />
             </form>
           ) : (
             <Search 
                className="w-6 h-6 text-gray-300 hover:text-white cursor-pointer transition-transform hover:scale-110" 
                onClick={() => setSearchOpen(true)}
             />
           )}
           <Bell className="w-6 h-6 text-gray-300 hover:text-white cursor-pointer hover:animate-pulse" />
           <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 cursor-pointer hover:ring-2 hover:ring-white transition-all"></div>
        </div>
      </div>
    </nav>
  );
};

// --- HERO SLIDER COMPONENT ---
const HeroSlider = ({ data }: { data: any[] }) => {
    const [current, setCurrent] = useState(0);
    const router = useRouter();
  
    useEffect(() => {
      const timer = setInterval(() => {
        setCurrent(prev => (prev + 1) % (data.length || 1));
      }, 7000);
      return () => clearInterval(timer);
    }, [data]);
  
    if (!data || data.length === 0) return null;
    const movie = data[current];
  
    const handlePlayClick = () => {
        if (movie.link) {
            // Encode link for security like /v/[slug]
            const encodedLink = btoa(movie.link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            router.push(`/v/${encodedLink}`);
        } else {
            router.push(`/search?q=${encodeURIComponent(movie.title)}`);
        }
    };
  
    return (
      <div className="relative h-[90vh] w-full overflow-hidden group">
         {/* BACKGROUND IMAGE */}
         <div className="absolute inset-0">
            {/* Old Image Fade Out */}
            <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out opacity-0"
                 style={{ backgroundImage: `url(${data[(current - 1 + data.length) % data.length]?.poster})` }}>
            </div>
            {/* New Image Fade In */}
            <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out scale-105 group-hover:scale-110"
                 style={{ backgroundImage: `url(${movie.poster})` }}>
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent"></div>
         </div>
  
         {/* CONTENT */}
         <div className="absolute bottom-0 left-0 p-6 md:p-16 w-full max-w-4xl flex flex-col gap-6 z-10">
             {/* Tags/Rating */}
             <div className="flex items-center gap-4 animate-fade-in-up">
                 <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 text-xs font-bold rounded-md border border-yellow-500/30 flex items-center gap-1">
                    <Star size={12} fill="currentColor" /> {movie.rating}
                 </span>
                 {movie.tags?.map((tag: string, i: number) => (
                    <span key={i} className="text-gray-300 text-xs font-medium uppercase tracking-wider border-l border-gray-600 pl-4">
                        {tag}
                    </span>
                 ))}
             </div>
  
             {/* Title */}
             <h1 className="text-5xl md:text-7xl font-black text-white leading-tight drop-shadow-2xl animate-slide-in">
                {movie.title}
             </h1>
  
             {/* Description */}
             <p className="text-gray-300 text-lg line-clamp-3 max-w-2xl drop-shadow-md animate-fade-in delay-100">
                {movie.desc}
             </p>
  
             {/* Buttons */}
             <div className="flex gap-4 pt-4 animate-fade-in delay-200">
                <button 
                  onClick={handlePlayClick}
                  className="bg-white text-black px-8 py-3.5 rounded-lg font-bold flex items-center gap-3 hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
                >
                    <Play fill="black" size={20} /> 
                    {movie.link ? "Play Now" : "Search Now"}
                </button>
                <button className="bg-gray-600/40 backdrop-blur-md text-white px-8 py-3.5 rounded-lg font-bold flex items-center gap-3 hover:bg-gray-600/60 transition-all border border-white/10">
                    <Info size={20} /> More Info
                </button>
             </div>
         </div>
  
         {/* Right Side Carousel Indicators (Optional) */}
         <div className="absolute right-12 bottom-1/2 translate-y-1/2 flex flex-col gap-4 z-20">
            {data.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-12 rounded-full transition-all duration-300 ${
                    idx === current ? 'bg-purple-500 scale-y-125' : 'bg-gray-700/50'
                  }`}
                />
            ))}
         </div>
      </div>
    );
};

// --- MOVIE ROW SECTION ---
const MovieSection = ({ title, items }: { title: string, items: any[] }) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
  
    const scroll = (direction: 'left' | 'right') => {
      if (rowRef.current) {
        const { scrollLeft, clientWidth } = rowRef.current;
        const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
        rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      }
    };
  
    const handleItemClick = (item: any) => {
        if (item.link) {
            const encodedLink = btoa(item.link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            router.push(`/v/${encodedLink}`);
        } else {
            router.push(`/search?q=${encodeURIComponent(item.title)}`);
        }
    };
  
    if (!items || items.length === 0) return null;
  
    return (
      <div className="mb-12 relative group/section px-4 md:px-12">
        <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2 group-hover/section:text-purple-400 transition-colors">
            {title} <ChevronRight size={20} className="opacity-0 group-hover/section:opacity-100 transition-opacity -translate-x-2 group-hover/section:translate-x-0" />
        </h2>
  
        <div className="relative group">
            <ChevronRight 
                className="absolute left-0 top-0 bottom-0 z-20 m-auto h-full w-12 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-black/70 cursor-pointer transition-all rotate-180 text-white" 
                onClick={() => scroll('left')} 
            />
            
            <div 
              ref={rowRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-1"
            >
              {items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="relative min-w-[180px] md:min-w-[220px] h-[280px] md:h-[330px] rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 group/card shadow-lg hover:shadow-purple-500/20 bg-gray-900"
                  onClick={() => handleItemClick(item)}
                >
                    <img 
                      src={item.image || item.poster} 
                      alt={item.title} 
                      className="w-full h-full object-cover opacity-90 group-hover/card:opacity-100" 
                      loading="lazy"
                    />
                    
                    {/* Hover Info Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <h3 className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">{item.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                            {item.quality && (
                                <span className="bg-gray-700 px-1.5 rounded text-[10px]">{item.quality}</span>
                            )}
                            <span className="flex items-center gap-1"><Star size={10} className="text-yellow-500" /> 8.5</span>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                             <button className="bg-white text-black p-2 rounded-full hover:bg-purple-500 hover:text-white transition-colors">
                                <Play size={12} fill="currentColor" />
                             </button>
                             <button className="border border-gray-400 text-white p-2 rounded-full hover:border-white hover:bg-white/10">
                                <Info size={12} />
                             </button>
                        </div>
                    </div>
                </div>
              ))}
            </div>
  
            <ChevronRight 
                className="absolute right-0 top-0 bottom-0 z-20 m-auto h-full w-12 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-black/70 cursor-pointer transition-all text-white" 
                onClick={() => scroll('right')} 
            />
        </div>
      </div>
    );
};

// --- MAIN PAGE LOGIC ---
function HomePageContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/home', { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setData(json.data);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
         <X size={48} className="text-red-500 mb-4" />
         <h1 className="text-2xl font-bold">Failed to load content</h1>
         <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-red-600 rounded hover:bg-red-700">Retry</button>
      </div>
    );
  }

  if (loading) {
    return (
       <div className="min-h-screen bg-[#0a0a0a]">
           <NavbarSkeleton />
           <HeroSkeleton />
           <SectionSkeleton />
           <SectionSkeleton />
       </div>
    );
  }

  return (
    // ✅ 1. Main Container: Transparent Background + Stars
    <div className="min-h-screen relative bg-transparent text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
      
      {/* 🌟 Twinkling Stars Background (Fixed) */}
      <TwinklingStars />

      {/* ✅ 2. Content Wrapper: Transparent Overlay to allow stars visibility */}
      <div className="relative z-10 bg-gradient-to-b from-transparent via-black/60 to-[#0a0a0a]">
          <Navbar />

          <div className="pb-20">
            {/* Hero Section */}
            {data?.hero && <HeroSlider data={data.hero} />}

            {/* Movie Sections */}
            <div className="-mt-32 relative z-20 space-y-8">
                {data?.sections?.map((sec: any, idx: number) => (
                    <MovieSection key={idx} title={sec.title} items={sec.items} />
                ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="bg-[#0a0a0a] border-t border-gray-900 py-16 px-6 md:px-20 relative z-30">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-7xl mx-auto">
                  {/* Brand Column */}
                  <div className="space-y-4">
                      <div className="flex items-center gap-2">
                          <MonitorPlay className="text-purple-600" size={32} />
                          <span className="text-2xl font-black text-white">NETVLYX</span>
                      </div>
                      <p className="text-gray-500 text-sm leading-relaxed">
                          Your premium destination for unlimited entertainment. Stream the latest movies, series, and originals in high quality.
                      </p>
                      <div className="flex gap-4 pt-2">
                          {[1, 2, 3].map((i) => (
                              <div key={i} className="w-8 h-8 rounded-full bg-gray-800 hover:bg-purple-600 cursor-pointer transition-colors flex items-center justify-center text-white">
                                  <Globe size={14} />
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Links Columns */}
                  <div>
                      <h4 className="text-white font-bold mb-6">Explore</h4>
                      <ul className="space-y-3 text-gray-400 text-sm">
                          {['Home', 'Movies', 'TV Shows', 'New Arrivals', 'Trending'].map(item => (
                              <li key={item} className="hover:text-purple-400 cursor-pointer transition-colors">{item}</li>
                          ))}
                      </ul>
                  </div>

                  <div>
                      <h4 className="text-white font-bold mb-6">Support</h4>
                      <ul className="space-y-3 text-gray-400 text-sm">
                          {['Help Center', 'Terms of Service', 'Privacy Policy', 'Cookie Preferences', 'Corporate Info'].map(item => (
                              <li key={item} className="hover:text-purple-400 cursor-pointer transition-colors">{item}</li>
                          ))}
                      </ul>
                  </div>

                  {/* Contact Column */}
                  <div>
                      <h4 className="text-white font-bold mb-6">Contact Us</h4>
                      <ul className="space-y-4 text-sm">
                          <li className="flex items-center gap-3 text-gray-400">
                              <Mail size={18} className="text-purple-500"/> 
                              <span className="hover:text-white cursor-pointer">contact@sadabefy.com</span>
                          </li>
                          <li className="flex items-center gap-3 text-gray-400">
                              <Instagram size={18} className="text-purple-500"/> 
                              <span className="hover:text-white cursor-pointer">@sadab_official</span>
                          </li>
                      </ul>
                  </div>
              </div>

              <div className="border-t border-gray-900 pt-8 mt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-gray-500 text-sm">
                      <p className="mb-1">Developed & Managed By</p>
                      <h4 className="text-lg font-bold text-yellow-500">Sadab Codes</h4>
                      <p className="text-xs">Professional Web Development</p>
                  </div>
                  
                  <div className="text-gray-600 text-xs text-center md:text-right max-w-md">
                      <p className="mb-2">© 2025 Sadabefy. All rights reserved.</p>
                      <p>Disclaimer: Sadabefy does not host any content. We only index and provide links to content that is publicly available on the internet.</p>
                  </div>
              </div>
          </footer>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
