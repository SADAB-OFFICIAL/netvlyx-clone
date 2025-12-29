// app/api/home/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // --- STEALTH SECURITY LAYER ---
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Agar direct access hai, to aysa error do jo bilkul real lage
  

  const BASE_URL = "https://netvlyx.pages.dev";

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Referer": "https://netvlyx.pages.dev/",
    "Origin": "https://netvlyx.pages.dev"
  };

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
    const [
      trendingData, latestData, bollywoodData, 
      hollywoodData, southData, animeData, koreanData
    ] = await Promise.all([
      fetchCategory("/api/tmdb-popular-india"),
      fetchCategory("/api/category/latest"),
      fetchCategory("/api/category/bollywood"),
      fetchCategory("/api/category/hollywood"),
      fetchCategory("/api/category/south-hindi-movies"),
      fetchCategory("/api/category/anime"),
      fetchCategory("/api/category/korean")
    ]);

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
        { title: "Latest Uploads", items: latestData },
        { title: "Bollywood Hits", items: bollywoodData },
        { title: "South Indian Hindi", items: southData },
        { title: "Hollywood Blockbusters", items: hollywoodData },
        { title: "K-Drama World", items: koreanData },
        { title: "Anime Series", items: animeData }
      ]
    };

    return NextResponse.json({ success: true, data: finalData });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Service Unavailable" }, { status: 503 });
  }
}
