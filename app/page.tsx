// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Film, Tv, Play } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [movies, setMovies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch Movies
  const fetchMovies = async (query = '', cat = 'home') => {
    setLoading(true);
    try {
      const url = query 
        ? `/api/scrape?s=${query}` 
        : `/api/scrape?category=${cat}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setMovies(data.movies || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
            NetVlyx
          </h1>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchMovies(search)}
            />
            <button onClick={() => fetchMovies(search)} className="bg-red-600 p-2 rounded-full">
              <Search size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-10 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Latest Uploads</h2>
        
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-red-500"></div></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map((movie, idx) => {
              // Create a safe slug for the URL
              const slug = movie.link ? btoa(movie.link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') : '';
              
              return (
                <Link key={idx} href={`/v/${slug}`} className="group relative block bg-gray-900 rounded-lg overflow-hidden transition-transform hover:scale-105">
                  <div className="aspect-[2/3] relative">
                    <img src={movie.poster} alt={movie.title} className="object-cover w-full h-full group-hover:opacity-80 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="bg-red-600 text-white rounded-full p-2 h-12 w-12" />
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium line-clamp-2 text-gray-200 group-hover:text-red-400">
                      {movie.title}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
