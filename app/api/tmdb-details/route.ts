// app/api/tmdb-details/route.ts
import { NextResponse } from 'next/server';

const TMDB_KEY = "848d4c9db9d3f19d0229dc95735190d3"; // API Key

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imdbId = searchParams.get('imdb_id');

  if (!imdbId) return NextResponse.json({ error: 'IMDb ID Required' }, { status: 400 });

  try {
    // Step 1: Find by IMDb ID
    const findUrl = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_KEY}&external_source=imdb_id`;
    const findRes = await fetch(findUrl);
    const findData = await findRes.json();

    const movie = findData.movie_results?.[0];
    const tv = findData.tv_results?.[0];
    const item = movie || tv;
    const type = movie ? 'movie' : 'tv';

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
