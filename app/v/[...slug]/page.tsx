"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { 
  Play, 
  Download, 
  Star, 
  Share2, 
  ArrowLeft, 
  HardDrive, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; 
import Link from "next/link";

// --- Types ---
interface DownloadLink {
  quality: string;
  size: string;
  url: string;
  type?: string;
}

interface MovieData {
  title: string;
  description: string;
  rating: string;
  year: string;
  duration: string;
  genres: string[];
  poster: string;
  background: string;
  downloadLinks: DownloadLink[];
}

export default function MovieSlugPage() {
  const params = useParams();
  const slug = params?.slug;

  const [data, setData] = useState<MovieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Animation State
  const [showDownloads, setShowDownloads] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    // Mocking Data fetch for demonstration
    // Replace this with your actual API call logic
    const fetchData = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        // Simulate API delay (Remove this in production)
        // await new Promise(resolve => setTimeout(resolve, 500)); 
        
        // Mock Data (Delete this when connecting real API)
        setData({
             title: "Stranger Things",
             description: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.",
             rating: "9.8",
             year: "2024",
             duration: "2h 15m",
             genres: ["Sci-Fi", "Horror", "Drama"],
             poster: "https://image.tmdb.org/t/p/original/xETnLqYn5lD0yOaK3hN9rK1j1y.jpg",
             background: "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYkQV8462nZ.jpg",
             downloadLinks: [
               { quality: "480p", size: "450MB", url: "#" },
               { quality: "720p", size: "1.2GB", url: "#" },
               { quality: "1080p", size: "2.5GB", url: "#" },
               { quality: "4K HDR", size: "6.8GB", url: "#" },
             ],
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#141414] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#141414] text-white">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold">Data Not Found</h2>
          <Link href="/" className="mt-6 inline-block rounded bg-white px-6 py-2 text-black font-bold">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#141414] text-white overflow-x-hidden">
      
      {/* Background Image - STATIC (No Animation for performance) */}
      <div className="absolute inset-0 h-[85vh] w-full">
        <Image
          src={data.background}
          alt={data.title}
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/30 to-transparent" />
      </div>

      <div className="absolute top-0 left-0 z-50 p-6">
        <Link href="/" className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 backdrop-blur-md hover:bg-white/20">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-[35vh] pb-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[300px_1fr]">
          
          {/* Poster - STATIC (Removed motion.div) */}
          <div className="hidden lg:block">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl shadow-2xl shadow-red-900/20 border border-white/10">
              <Image
                src={data.poster}
                alt={data.title}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col justify-end">
            
            {/* Title & Metadata - STATIC (Instant Load) */}
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                {data.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-medium text-gray-300">
                <span className="flex items-center gap-1 text-green-400">
                  <Star className="h-4 w-4 fill-current" /> {data.rating} Match
                </span>
                <span>{data.year}</span>
                <span className="rounded bg-white/20 px-2 py-0.5 text-xs text-white">HD</span>
                <span>{data.duration}</span>
              </div>

              <p className="mt-6 max-w-3xl text-lg text-gray-300 leading-relaxed line-clamp-4">
                {data.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {data.genres?.map((genre, idx) => (
                  <span
                    key={idx}
                    className="rounded-full border border-white/20 bg-white/5 px-4 py-1 text-sm hover:bg-white/10"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons - STATIC Container */}
            <div className="mt-8 flex flex-wrap gap-4">
              <button className="flex items-center gap-2 rounded bg-white px-8 py-3 text-lg font-bold text-black transition hover:bg-white/90 active:scale-95">
                <Play className="h-6 w-6 fill-current" />
                Play Now
              </button>

              <button
                onClick={() => setShowDownloads(!showDownloads)}
                className={`flex items-center gap-2 rounded border px-8 py-3 text-lg font-bold transition active:scale-95 
                  ${showDownloads 
                    ? "bg-red-600 border-red-600 text-white" 
                    : "bg-white/20 border-white/20 text-white hover:bg-white/30"
                  }`}
              >
                <Download className={`h-6 w-6 ${showDownloads ? "animate-bounce" : ""}`} />
                {showDownloads ? "Close Downloads" : "Download"}
              </button>

              <button className="flex items-center gap-2 rounded border border-white/20 bg-white/10 px-4 py-3 text-white transition hover:bg-white/20">
                <Share2 className="h-6 w-6" />
              </button>
            </div>

            {/* -------------------------------------------------------
               ANIMATION ZONE START (Sirf yaha animation hai)
               -------------------------------------------------------
            */}
            <AnimatePresence>
              {showDownloads && data.downloadLinks && (
                <motion.div
                  // Fast & Snappy Animation
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ 
                    height: "auto", 
                    opacity: 1, 
                    marginTop: 32,
                    transition: { duration: 0.25, ease: "easeOut" } // 0.25s is fast
                  }}
                  exit={{ 
                    height: 0, 
                    opacity: 0, 
                    marginTop: 0,
                    transition: { duration: 0.2, ease: "easeIn" }
                  }}
                  className="overflow-hidden w-full max-w-2xl"
                >
                  <div className="rounded-xl border border-white/10 bg-[#1f1f1f]/95 p-6 backdrop-blur-md shadow-2xl">
                    <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <HardDrive className="text-red-500 w-5 h-5"/> Available Qualities
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {data.downloadLinks.map((link, index) => (
                        <motion.a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          // Very subtle stagger, almost instant
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                          className="group flex items-center justify-between rounded-lg bg-black/40 p-4 transition duration-200 hover:bg-white/10 hover:border-l-4 hover:border-red-600 border-l-4 border-transparent cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-lg group-hover:text-red-500 transition-colors">
                              {link.quality}
                            </span>
                            <span className="text-xs text-gray-400">{link.size} • {link.type || "MKV"}</span>
                          </div>
                          
                          <div className="rounded-full bg-white/10 p-2 text-white transition group-hover:bg-red-600">
                            <Download className="h-5 w-5" />
                          </div>
                        </motion.a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* ANIMATION ZONE END */}

          </div>
        </div>
      </div>
    </div>
  );
}
