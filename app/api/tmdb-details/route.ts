import { NextResponse } from 'next/server';

const TMDB_KEY = "848d4c9db9d3f19d0229dc95735190d3";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let imdbId = searchParams.get('imdb_id');
  const query = searchParams.get('query');
  const year = searchParams.get('year'); // ✅ Year Support

  if (!imdbId && !query) {
      return NextResponse.json({ error: 'ID or Query Required' }, { status: 400 });
  }

  try {
    // 1. Search by Title (+ Year) if ID missing
    if (!imdbId && query) {
        const cleanQuery = query.replace(/\s*(?:Season|S)\s*\d+.*$/i, '').trim();
        
        // Search URL logic
        let searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(cleanQuery)}`;
        
        // Add Year filter if available (Greatly improves accuracy)
        if (year) {
             // For movies
             searchUrl += `&year=${year}`; 
             // Note: 'multi' search supports 'year' param but primarily for movies.
        }

        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        // Pick first result
        const firstResult = searchData.results?.[0];
        if (firstResult) {
            const type = firstResult.media_type === 'tv' ? 'tv' : 'movie';
            const idUrl = `https://api.themoviedb.org/3/${type}/${firstResult.id}/external_ids?api_key=${TMDB_KEY}`;
            const idRes = await fetch(idUrl);
            const idData = await idRes.json();
            imdbId = idData.imdb_id;
        }
    }

    if (!imdbId) return NextResponse.json({ found: false });

    // 2. Call Netvlyx API
    const targetApi = `https://netvlyx.pages.dev/api/tmdb-details?imdb_id=${imdbId}`;
    const response = await fetch(targetApi, {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://netvlyx.pages.dev/'
        },
        next: { revalidate: 3600 }
    });

    if (!response.ok) throw new Error("API Failed");
    const data = await response.json();

    return NextResponse.json({ found: true, ...data });

  } catch (error) {
    return NextResponse.json({ found: false });
  }
}
