// app/api/home/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const BASE_URL = "https://netvlyx.pages.dev";

  // Headers are CRITICAL (Copied from your Python script)
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Referer": "https://netvlyx.pages.dev/",
    "Origin": "https://netvlyx.pages.dev"
  };

  // Helper function to fetch data securely
  const fetchCategory = async (endpoint: string) => {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, { 
        headers,
        next: { revalidate: 600 } // Cache for 10 mins
      });
      if (!res.ok) return [];
      const json = await res.json();
      // Handle different response structures
      return json.results || json.movies || []; 
    } catch (e) {
      console.error(`Failed to fetch ${endpoint}`, e);
      return [];
    }
  };

  try {
    // Parallel Fetching for Speed (Jaise Python mein alag alag call karte)
    const [
      trendingData,
      latestData,
      bollywoodData,
      hollywoodData,
      southData,
      animeData,
      koreanData
    ] = await Promise.all([
      fetchCategory("/api/tmdb-popular-india"),      // Best for Hero Slider
      fetchCategory("/api/category/latest"),         // Latest Row
      fetchCategory("/api/category/bollywood"),
      fetchCategory("/api/category/hollywood"),
      fetchCategory("/api/category/south-hindi-movies"),
      fetchCategory("/api/category/anime"),
      fetchCategory("/api/category/korean")
    ]);

    // Construct Final Data Package
    const finalData = {
      // Hero Slider (Use TMDB data because it has High Quality Backdrops)
      hero: trendingData.map((item: any) => ({
        title: item.title || item.name,
        desc: item.overview,
        poster: item.backdrop || item.poster, // High Res Image
        rating: item.rating || "8.5",
        link: "", // TMDB items usually don't have direct links, search fallback used
        tags: ["Trending", "Popular"]
      })),

      // Rows (Use Category Data)
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
    return NextResponse.json({ success: false, error: error.message });
  }
}
