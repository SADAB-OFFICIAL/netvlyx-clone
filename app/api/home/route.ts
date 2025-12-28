// app/api/home/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Define all the endpoints used by Real NetVlyx
    const endpoints = {
      trending: 'https://netvlyx.pages.dev/api/tmdb-popular-india',
      latest: 'https://netvlyx.pages.dev/api/scrape', // Home/Latest uploads
      bollywood: 'https://netvlyx.pages.dev/api/category/bollywood',
      hollywood: 'https://netvlyx.pages.dev/api/category/hollywood',
      south: 'https://netvlyx.pages.dev/api/category/south-hindi-movies',
      anime: 'https://netvlyx.pages.dev/api/category/anime',
      korean: 'https://netvlyx.pages.dev/api/category/korean',
      webseries: 'https://netvlyx.pages.dev/api/category/web-series'
    };

    // Helper to fetch data safely
    const fetchData = async (url: string) => {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          next: { revalidate: 600 } // 10 minutes cache
        });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        return null;
      }
    };

    // Fetch all in parallel for speed
    const [trending, latest, bollywood, hollywood, south, anime, korean, webseries] = await Promise.all([
      fetchData(endpoints.trending),
      fetchData(endpoints.latest),
      fetchData(endpoints.bollywood),
      fetchData(endpoints.hollywood),
      fetchData(endpoints.south),
      fetchData(endpoints.anime),
      fetchData(endpoints.korean),
      fetchData(endpoints.webseries)
    ]);

    // Structure the response for the frontend
    const responseData = {
      hero: trending?.results || [], // TMDB data for Hero Slider (High Quality)
      sections: [
        { title: "Latest Uploads", data: latest?.movies || [], type: 'standard' },
        { title: "Bollywood Hits", data: bollywood?.movies || [], type: 'standard' },
        { title: "Hollywood Blockbusters", data: hollywood?.movies || [], type: 'standard' },
        { title: "South Indian Movies", data: south?.movies || [], type: 'standard' },
        { title: "Trending Web Series", data: webseries?.movies || [], type: 'standard' },
        { title: "Anime World", data: anime?.movies || [], type: 'standard' },
        { title: "K-Drama", data: korean?.movies || [], type: 'standard' }
      ]
    };

    return NextResponse.json({ success: true, data: responseData });

  } catch (error: any) {
    console.error("API Aggregation Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch NetVlyx data' });
  }
}
