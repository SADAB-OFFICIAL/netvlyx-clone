'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import { Play, Star, ChevronLeft, Loader2 } from 'lucide-react';
import TwinklingStars from '@/components/TwinklingStars';

// Params ko unwrap karne ka sahi tareeka (Next.js 15+ compatible)
export default function CategoryPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const slug = params.slug; // Direct access works in most Next versions, or use React.use() in newest

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Title formatting (e.g., 'latest' -> 'Latest Movies')
  const categoryTitle = slug ? (slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' ')) : "Movies";

  const fetchMovies = async (pageNum: number) => {
    try {
      const res = await fetch(`/api/category-data?slug=${slug}&page=${pageNum}`);
      if (!res.ok) throw new Error("API Failed");
      
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        setItems(prev => [...prev, ...data.results]);
        // Agar 20 se kam items aaye to samjho aage aur data nahi hai
        if (data.results.length < 10) setHasMore(false); 
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
        fetchMovies(1);
    }
  }, [slug]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMovies(nextPage);
  };

  const handleItemClick = (item: any) => {
      if (item.link) {
          const encodedLink = btoa(item.link).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
          router.push(`/v/${encodedLink}`);
      } else {
          router.push(`/search?q=${encodeURIComponent(item.title)}`);
      }
  };

  return (
    <div className="min-h-screen relative bg-black text-white font-sans">
      <TwinklingStars />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800 px-4 md:px-12 py-4 flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-gray-800 rounded-full hover:bg-white hover:text-black transition-colors">
                <ChevronLeft size={20} />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-yellow-500 capitalize">{categoryTitle} Movies</h1>
        </div>

        {/* Grid Content */}
        <div className="p-4 md:p-12 pb-20">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {items.map((item, idx) => (
                    <div 
                        key={idx} 
                        className="relative group aspect-[2/3] bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:scale-105 hover:shadow-yellow-500/20 hover:z-10 transition-all duration-300"
                        onClick={() => handleItemClick(item)}
                    >
                        <img 
                            src={item.image || item.poster} 
                            alt={item.title} 
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100"
                            loading="lazy"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                            <h3 className="text-sm font-bold leading-tight line-clamp-2">{item.title}</h3>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-300">
                                <span className="bg-yellow-500 text-black px-1.5 rounded font-bold text-[10px]">HD</span>
                                <span className="flex items-center gap-1"><Star size={10} className="text-yellow-500" /> 8.5</span>
                            </div>
                         </div>
                    </div>
                ))}
            </div>

            {/* Pagination Button */}
            {hasMore && !loading && (
                <div className="mt-12 text-center">
                    <button 
                        onClick={handleLoadMore}
                        className="px-8 py-3 bg-gray-800 border border-gray-700 rounded-full text-white hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition-all font-bold"
                    >
                        Load More Movies
                    </button>
                </div>
            )}

            {loading && (
                <div className="mt-12 flex justify-center">
                    <Loader2 className="animate-spin text-yellow-500" size={32} />
                </div>
            )}
            
            {!loading && items.length === 0 && (
                <div className="text-center mt-20 text-gray-500 flex flex-col items-center gap-4">
                    <h2 className="text-xl font-bold">No movies found</h2>
                    <p className="text-sm">Try checking another category.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
