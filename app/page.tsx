// app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Play, 
  Info, 
  ChevronRight, 
  ChevronLeft, 
  Menu, 
  Bell, 
  TrendingUp,
  Film,
  Tv
} from 'lucide-react';

// --- Types ---
interface Movie {
  title: string;
  poster: string;
  link: string;
  quality?: string; // e.g. HD, CAM
}

interface SectionProps {
  title: string;
  category: string;
}

// --- Components ---

// 1. Movie Card Component
const MovieCard = ({ movie }: { movie: Movie }) => {
  // Secure Slug Generation
  const slug = movie.link 
    ? btoa(movie.link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') 
    : '';

  return (
    <Link href={`/v/${slug}`} className="group relative flex-shrink-0 w-[140px] sm:w-[180px] md:w-[220px] cursor-pointer transition-all duration-300 hover:z-20 hover:scale-110">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg bg-gray-900">
        <img 
          src={movie.poster || '/placeholder.png'} 
          alt={movie.title} 
          className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-75"
          loading="lazy"
          onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/220x330?text=No+Image')}
        />
        
        {/* Quality Badge */}
        {movie.quality && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            {movie.quality}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black via-black/60 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors">
              <Play size={16} className="fill-current ml-0.5" />
            </div>
            <div className="border border-gray-400 text-white rounded-full p-2 hover:bg-gray-800 transition-colors">
              <Info size={16} />
            </div>
          </div>
          <h3 className="text-white text-xs sm:text-sm font-bold leading-tight line-clamp-2">
            {movie.title}
          </h3>
          <p className="text-green-400 text-[10px] font-semibold mt-1">
            New • 2024
          </p>
        </div>
      </div>
    </Link>
  );
};

// 2. Horizontal Row Component (Slider)
const MovieRow = ({ title, category }: SectionProps) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const rowRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Calling our Scraper API
        const res = await fetch(`/api/scrape?category=${category}`);
        const data = await res.json();
        setMovies(data.movies || []);
      } catch (err) {
        console.error(`Failed to fetch ${category}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [category]);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth / 2 
        : scrollLeft + clientWidth / 2;
      
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (loading) return (
    <div className="mb-8 px-4 md:px-12 space-y-4">
      <div className="h-6 w-48 bg-gray-800 rounded animate-pulse"></div>
      <div className="flex gap-4 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[140px] sm:w-[180px] h-[240px] bg-gray-800 rounded-lg animate-pulse"></div>
        ))}
      </div>
    </div>
  );

  if (movies.length === 0) return null;

  return (
    <div className="mb-8 md:mb-12 group relative px-4 md:px-12">
      <h2 className="text-lg md:text-2xl font-bold text-white mb-4 hover:text-red-500 transition-colors cursor-pointer flex items-center gap-2">
        {title} <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Explore All &gt;</span>
      </h2>
      
      <div className="relative">
        {/* Left Arrow */}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-40 bg-black/50 hover:bg-black/80 text-white w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-r-lg"
        >
          <ChevronLeft size={32} />
        </button>

        {/* Scrollable Container */}
        <div 
          ref={rowRef}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-4 pt-4 px-1"
          style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none' }}
        >
          {movies.map((movie, idx) => (
            <MovieCard key={idx} movie={movie} />
          ))}
        </div>

        {/* Right Arrow */}
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-40 bg-black/50 hover:bg-black/80 text-white w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-l-lg"
        >
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );
};

// 3. Hero Section (Featured Movie)
const HeroSection = () => {
  const [featured, setFeatured] = useState<Movie | null>(null);

  useEffect(() => {
    // Fetch latest and pick the first one as Hero
    fetch('/api/scrape?category=home')
      .then(res => res.json())
      .then(data => {
        if (data.movies && data.movies.length > 0) {
          setFeatured(data.movies[0]); // First movie is featured
        }
      });
  }, []);

  if (!featured) return <div className="h-[60vh] md:h-[80vh] bg-gray-900 animate-pulse"></div>;

  const slug = featured.link 
    ? btoa(featured.link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') 
    : '';

  return (
    <div className="relative h-[60vh] md:h-[85vh] w-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={featured.poster} 
          alt={featured.title} 
          className="w-full h-full object-cover object-top opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-4 md:px-12 max-w-7xl mx-auto pt-20">
        <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded w-fit mb-4 flex items-center gap-2">
          <TrendingUp size={14} /> #1 in Trending Today
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white max-w-2xl leading-tight mb-4 drop-shadow-lg">
          {featured.title}
        </h1>
        <p className="text-gray-300 text-sm md:text-lg max-w-xl mb-8 line-clamp-3 drop-shadow-md">
          Stream the latest blockbuster directly on NetVlyx. High quality, multi-audio support, and fast servers available now.
        </p>
        <div className="flex items-center gap-4">
          <Link 
            href={`/v/${slug}`}
            className="flex items-center gap-2 bg-white text-black px-6 md:px-8 py-3 rounded-md font-bold text-lg hover:bg-gray-200 transition-colors"
          >
            <Play size={24} className="fill-current" /> Play
          </Link>
          <button className="flex items-center gap-2 bg-gray-500/30 backdrop-blur-sm text-white px-6 md:px-8 py-3 rounded-md font-bold text-lg hover:bg-gray-500/50 transition-colors border border-white/20">
            <Info size={24} /> More Info
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Handle Navbar Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/scrape?s=${searchQuery}`);
      const data = await res.json();
      setSearchResults(data.movies || []);
    } catch (error) {
      console.error(error);
    }
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
      
      {/* Navbar */}
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-500 px-4 md:px-12 py-3 md:py-4 flex items-center justify-between ${
          isScrolled ? 'bg-black/90 backdrop-blur-md shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'
        }`}
      >
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent cursor-pointer">
            NETVLYX
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="#" className="hover:text-white transition-colors">TV Shows</Link>
            <Link href="#" className="hover:text-white transition-colors">Movies</Link>
            <Link href="#" className="hover:text-white transition-colors">New & Popular</Link>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <input 
              type="text" 
              placeholder="Titles, people, genres" 
              className={`bg-black/50 border ${isScrolled ? 'border-gray-600' : 'border-white/30'} rounded-full py-1.5 px-4 pl-10 text-sm focus:outline-none focus:bg-black/80 focus:border-white transition-all w-[200px] md:w-[260px]`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1.5 text-gray-400 w-4 h-4" />
          </form>
          
          <Search className="sm:hidden text-white w-6 h-6 cursor-pointer" onClick={() => {
             const query = prompt("Search movies:");
             if(query) { setSearchQuery(query); handleSearch({ preventDefault: () => {} } as any); }
          }} />

          <Bell className="text-white w-5 h-5 cursor-pointer hover:text-gray-300 transition-colors" />
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-500 cursor-pointer"></div>
        </div>
      </nav>

      {/* Main Content Area */}
      {searchResults.length > 0 || isSearching ? (
        // Search Results View
        <div className="pt-24 px-4 md:px-12 min-h-screen">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl text-gray-400">
               Results for: <span className="text-white font-bold">"{searchQuery}"</span>
             </h2>
             <button 
               onClick={() => { setSearchResults([]); setSearchQuery(''); }}
               className="text-red-500 text-sm hover:underline"
             >
               Clear Search
             </button>
           </div>
           
           {isSearching ? (
             <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-red-600"></div></div>
           ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
               {searchResults.map((movie, idx) => (
                 <div key={idx} className="mb-4">
                   <MovieCard movie={movie} />
                 </div>
               ))}
             </div>
           )}
        </div>
      ) : (
        // Standard Home View
        <>
          <HeroSection />
          
          <div className="-mt-20 relative z-10 pb-20">
            <MovieRow title="Latest Releases" category="home" />
            <MovieRow title="Trending Bollywood" category="bollywood" />
            <MovieRow title="Hollywood Blockbusters" category="hollywood" />
            <MovieRow title="Dual Audio Zone" category="dual-audio" />
            <MovieRow title="Binge-Worthy Series" category="web-series" />
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="py-12 px-4 md:px-12 bg-black/80 text-gray-500 text-sm border-t border-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-4 mb-4 text-white">
            <Film size={24} /> <Tv size={24} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link href="#" className="hover:underline">Audio Description</Link>
            <Link href="#" className="hover:underline">Investor Relations</Link>
            <Link href="#" className="hover:underline">Legal Notices</Link>
            <Link href="#" className="hover:underline">Help Centre</Link>
            <Link href="#" className="hover:underline">Jobs</Link>
            <Link href="#" className="hover:underline">Cookie Preferences</Link>
            <Link href="#" className="hover:underline">Gift Cards</Link>
            <Link href="#" className="hover:underline">Terms of Use</Link>
          </div>
          <button className="border border-gray-500 px-4 py-2 text-gray-400 hover:text-white mb-4">
            Service Code
          </button>
          <p>© 2024-2025 NetVlyx India. Crafted for streaming lovers.</p>
        </div>
      </footer>
    </div>
  );
}
