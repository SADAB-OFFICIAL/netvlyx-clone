// app/api/tmdb-details/route.ts
import { NextResponse } from 'next/server';

const TMDB_KEY = "848d4c9db9d3f19d0229dc95735190d3"; // Your Key

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imdbId = searchParams.get('imdb_id');

  if (!imdbId) return NextResponse.json({ error: 'IMDb ID Required' }, { status: 400 });

  try {
    // 1. Find Movie/TV by IMDb ID
    const findUrl = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_KEY}&external_source=imdb_id`;
    const findRes = await fetch(findUrl);
    const findData = await findRes.json();

    // Check results (Movie or TV)
    const result = findData.movie_results?.[0] || findData.tv_results?.[0];

    if (!result) return NextResponse.json({ found: false });

    return NextResponse.json({
        found: true,
        overview: result.overview,
        rating: result.vote_average ? result.vote_average.toFixed(1) : "N/A",
        backdrop: result.backdrop_path ? `https://image.tmdb.org/t/p/original${result.backdrop_path}` : null,
        poster: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : null
    });

  } catch (error) {
    return NextResponse.json({ error: 'TMDB Failed' });
  }
}
