import { NextResponse } from 'next/server';

const TMDB_KEY = "848d4c9db9d3f19d0229dc95735190d3"; // Public Key

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let imdbId = searchParams.get('imdb_id');
  const query = searchParams.get('query'); // Frontend Title bhejega

  // Agar na ID hai na Title, to error
  if (!imdbId && !query) {
      return NextResponse.json({ error: 'ID or Query Required' }, { status: 400 });
  }

  try {
    // --- STEP 1: Agar sirf Title hai, to pehle ID dhundo ---
    if (!imdbId && query) {
        // Year aur unnecessary text hatao search ke liye
        const cleanQuery = query.replace(/\s*(?:Season|S)\s*\d+.*$/i, '')
                                .replace(/\(\d{4}\)/, '')
                                .trim();
        
        const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(cleanQuery)}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        // Pehla result uthao
        const firstResult = searchData.results?.[0];
        
        if (firstResult) {
            // Ab is result ka External ID (IMDb ID) nikalo
            const type = firstResult.media_type === 'tv' ? 'tv' : 'movie';
            const idUrl = `https://api.themoviedb.org/3/${type}/${firstResult.id}/external_ids?api_key=${TMDB_KEY}`;
            const idRes = await fetch(idUrl);
            const idData = await idRes.json();
            
            imdbId = idData.imdb_id; // Mil gayi ID! (e.g. tt12844910)
        }
    }

    // Agar ab bhi ID nahi mili, to return false
    if (!imdbId) return NextResponse.json({ found: false });

    // --- STEP 2: Ab Netvlyx Official API call karo (Jaisa Python code mein tha) ---
    // Kyunki ab humare paas ID hai.
    const targetApi = `https://netvlyx.pages.dev/api/tmdb-details?imdb_id=${imdbId}`;
    
    const response = await fetch(targetApi, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://netvlyx.pages.dev/',
            'Origin': 'https://netvlyx.pages.dev',
            'Accept': 'application/json'
        },
        next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) throw new Error("Netvlyx API Failed");
    const data = await response.json();

    // Data return karo
    return NextResponse.json({
        found: true,
        // Netvlyx API ka structure pass karo
        ...data
    });

  } catch (error) {
    console.error("TMDB Proxy Error:", error);
    return NextResponse.json({ found: false });
  }
}
