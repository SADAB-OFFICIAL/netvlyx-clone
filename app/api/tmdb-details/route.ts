// app/api/tmdb-details/route.ts
import { NextResponse } from 'next/server';

const TMDB_KEY = "848d4c9db9d3f19d0229dc95735190d3"; // API Key

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imdbId = searchParams.get('imdb_id');
  const query = searchParams.get('query'); // Title search support

  if (!imdbId && !query) return NextResponse.json({ error: 'ID or Query Required' }, { status: 400 });

  try {
    let item = null;
    let type = 'movie';

    // A. Search by IMDb ID (Best Method)
    if (imdbId) {
        const findUrl = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_KEY}&external_source=imdb_id`;
        const findRes = await fetch(findUrl);
        const findData = await findRes.json();
        item = findData.movie_results?.[0] || findData.tv_results?.[0];
        type = findData.movie_results?.[0] ? 'movie' : 'tv';
    }

    // B. Search by Title (Fallback if ID missing)
    if (!item && query) {
        // Clean title (remove year/season info for better search)
        const cleanQuery = query.replace(/\s*(?:Season|S)\s*\d+.*$/i, '').replace(/\(\d{4}\)/, '').trim();
        const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(cleanQuery)}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        item = searchData.results?.[0]; // Pick first result
        if (item) type = item.media_type === 'tv' ? 'tv' : 'movie';
    }

    if (!item) return NextResponse.json({ found: false });

    // Step 2: Get Full Details (Videos + Images)
    const detailUrl = `https://api.themoviedb.org/3/${type}/${item.id}?api_key=${TMDB_KEY}&append_to_response=videos,images`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();

    // Extract Trailer (YouTube)
    const trailer = detailData.videos?.results?.find(
        (v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
    );

    return NextResponse.json({
        found: true,
        title: detailData.title || detailData.name,
        overview: detailData.overview,
        rating: detailData.vote_average ? detailData.vote_average.toFixed(1) : "N/A",
        // High Quality Images
        backdrop: detailData.backdrop_path ? `https://image.tmdb.org/t/p/original${detailData.backdrop_path}` : null,
        poster: detailData.poster_path ? `https://image.tmdb.org/t/p/w500${detailData.poster_path}` : null,
        trailerKey: trailer ? trailer.key : null,
        images: (detailData.images?.backdrops || []).map((img: any) => `https://image.tmdb.org/t/p/w780${img.file_path}`).slice(0, 6)
    });

  } catch (error) {
    return NextResponse.json({ error: 'TMDB Failed' });
  }
}
