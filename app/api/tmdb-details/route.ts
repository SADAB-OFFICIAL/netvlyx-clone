import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imdbId = searchParams.get('imdb_id');
  const query = searchParams.get('query'); // Title fallback

  // Agar IMDb ID nahi hai to error
  if (!imdbId && !query) {
      return NextResponse.json({ error: 'IMDb ID or Query Required' }, { status: 400 });
  }

  try {
    let apiUrl = '';

    // 1. Agar IMDb ID hai (Best case) -> Official NetVlyx API call karo
    if (imdbId) {
        apiUrl = `https://netvlyx.pages.dev/api/tmdb-details?imdb_id=${imdbId}`;
    } 
    // 2. Agar sirf Title (Query) hai -> To bhi koshish karo (Search API)
    else if (query) {
        // Note: NetVlyx shayad direct search na deta ho, par hum try kar sakte hain
        // Ya hum wapas apni purani TMDB logic fallback ke liye rakh sakte hain
        // Filhal hum IMDb ID par focus karte hain kyunki scraper wahi deta hai.
        return NextResponse.json({ found: false });
    }

    const response = await fetch(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://netvlyx.pages.dev/',
            'Origin': 'https://netvlyx.pages.dev'
        }
    });

    if (!response.ok) throw new Error("API Failed");
    const data = await response.json();

    // Data ko waisa hi return karo jaisa frontend expect kar raha hai
    return NextResponse.json({
        found: true,
        title: data.title,
        overview: data.overview,
        rating: data.rating,
        poster: data.poster,
        backdrop: data.backdrop,
        trailerKey: data.trailer?.key, // Yahan se Trailer Key milegi
        images: data.images, // Gallery Images
        cast: data.cast // Actors (Optional, agar future me chahiye)
    });

  } catch (error) {
    console.error("TMDB Proxy Error:", error);
    return NextResponse.json({ found: false });
  }
}
