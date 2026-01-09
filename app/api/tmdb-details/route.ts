import { NextResponse } from 'next/server';

const TMDB_KEY = "848d4c9db9d3f19d0229dc95735190d3";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let imdbId = searchParams.get('imdb_id');
  const query = searchParams.get('query');
  const year = searchParams.get('year'); 

  if (!imdbId && !query) {
      return NextResponse.json({ error: 'ID or Query Required' }, { status: 400 });
  }

  try {
    // ---------------------------------------------------------
    // 1. SMART SEARCH (If IMDB ID is missing)
    // ---------------------------------------------------------
    if (!imdbId && query) {
        // Remove Season/Episode info for better matching (e.g. "Money Heist S05" -> "Money Heist")
        const cleanQuery = query.replace(/\s*(?:Season|S)\s*\d+.*$/i, '')
                                .replace(/[\[\(].*?[\]\)]/g, '') // Remove brackets like (2024)
                                .trim();
        
        // Construct Search URL
        let searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(cleanQuery)}&include_adult=true&language=en-US`;
        
        // Year Logic: Movies ke liye strict, Series ke liye first_air_date_year
        if (year) {
             searchUrl += `&year=${year}`; // Works for movies primarily
        }

        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        // Result Filter Logic
        let bestMatch = searchData.results?.[0];
        
        // Agar Year diya hai aur wo TV Show hai, to manual check karo
        if (year && searchData.results) {
             const yearMatch = searchData.results.find((item: any) => 
                (item.release_date?.startsWith(year)) || (item.first_air_date?.startsWith(year))
             );
             if (yearMatch) bestMatch = yearMatch;
        }

        if (bestMatch) {
            const type = bestMatch.media_type === 'tv' ? 'tv' : 'movie';
            // Fetch External IDs to get IMDB ID
            const idUrl = `https://api.themoviedb.org/3/${type}/${bestMatch.id}/external_ids?api_key=${TMDB_KEY}`;
            const idRes = await fetch(idUrl);
            const idData = await idRes.json();
            
            if (idData.imdb_id) {
                imdbId = idData.imdb_id;
            } else {
                // Agar IMDB ID nahi mila, to TMDB ID hi return kar do (Netvlyx API might handle it)
                // Lekin usually Netvlyx IMDB ID mangta hai. 
                // Fallback: Return raw TMDB data if needed, but let's stick to flow.
            }
        }
    }

    if (!imdbId) {
        return NextResponse.json({ found: false, message: "No IMDB ID found on TMDB" });
    }

    // ---------------------------------------------------------
    // 2. FETCH METADATA (Netvlyx API)
    // ---------------------------------------------------------
    const targetApi = `https://netvlyx.pages.dev/api/tmdb-details?imdb_id=${imdbId}`;
    const response = await fetch(targetApi, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://netvlyx.pages.dev/'
        },
        next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) throw new Error("Netvlyx API Failed");
    const data = await response.json();

    return NextResponse.json({ found: true, ...data });

  } catch (error: any) {
    console.error("TMDB Route Error:", error.message);
    return NextResponse.json({ found: false, error: error.message });
  }
}
