import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // --- STEALTH SECURITY LAYER (Optional Check) ---
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Local API ko call karne ke liye Base URL nikalna zaroori hai
  const { protocol, host: requestHost } = new URL(request.url);
  const localBaseUrl = `${protocol}//${requestHost}`;

  const BASE_URL = "https://netvlyx.pages.dev";

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Referer": "https://netvlyx.pages.dev/",
    "Origin": "https://netvlyx.pages.dev"
  };

  // Helper Function for Official Netvlyx API
  const fetchCategory = async (endpoint: string) => {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, { 
        headers,
        next: { revalidate: 600 } 
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.results || json.movies || []; 
    } catch (e) {
      return [];
    }
  };

  try {
    // --- PARALLEL FETCHING (Official + MoviesDrive) ---
    const [
      trendingData, latestData, bollywoodData, 
      hollywoodData, southData, animeData, koreanData,
      moviesDriveRes // <--- Naya Data Source
    ] = await Promise.all([
      fetchCategory("/api/tmdb-popular-india"),
      fetchCategory("/api/category/latest"),
      fetchCategory("/api/category/bollywood"),
      fetchCategory("/api/category/hollywood"),
      fetchCategory("/api/category/south-hindi-movies"),
      fetchCategory("/api/category/anime"),
      fetchCategory("/api/category/korean"),
      
      // Fetching Local MoviesDrive Scraper
      fetch(`${localBaseUrl}/api/moviesdrive`, { cache: 'no-store' })
        .then(res => res.json())
        .catch(() => ({ success: false, data: { sections: [] } }))
    ]);

    // MoviesDrive ka section extract karna (Safety Check ke saath)
    const moviesDriveSections = (moviesDriveRes?.success && moviesDriveRes?.data?.sections) 
      ? moviesDriveRes.data.sections 
      : [];

    // --- FINAL DATA MERGING ---
    const finalData = {
      hero: trendingData.map((item: any) => ({
        title: item.title || item.name,
        desc: item.overview,
        poster: item.backdrop || item.poster,
        rating: item.rating || "8.5",
        link: "",
        tags: ["Trending", "Popular"]
      })),
      
      sections: [
        { title: "Latest Uploads (Netvlyx)", items: latestData },
        
        // Yahan MoviesDrive ka section add kar diya
        ...moviesDriveSections, 

        { title: "Bollywood Hits", items: bollywoodData },
        { title: "South Indian Hindi", items: southData },
        { title: "Hollywood Blockbusters", items: hollywoodData },
        { title: "K-Drama World", items: koreanData },
        { title: "Anime Series", items: animeData }
      ]
    };

    return NextResponse.json({ success: true, data: finalData });

  } catch (error: any) {
    console.error("Home API Error:", error);
    return NextResponse.json({ success: false, error: "Service Unavailable" }, { status: 503 });
  }
}
