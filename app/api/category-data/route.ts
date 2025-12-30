import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const page = searchParams.get('page') || '1';

    if (!slug) return NextResponse.json({ results: [] });

    // Slug Mapping to Official APIs
    let targetEndpoint = "";
    
    switch (slug) {
        case 'latest': targetEndpoint = `/api/category/latest?page=${page}`; break;
        case 'bollywood': targetEndpoint = `/api/category/bollywood?page=${page}`; break;
        case 'hollywood': targetEndpoint = `/api/category/hollywood?page=${page}`; break;
        case 'south': targetEndpoint = `/api/category/south-hindi-movies?page=${page}`; break;
        case 'anime': targetEndpoint = `/api/category/anime?page=${page}`; break;
        case 'korean': targetEndpoint = `/api/category/korean?page=${page}`; break;
        default: return NextResponse.json({ results: [] });
    }

    try {
        const res = await fetch(`https://netvlyx.pages.dev${targetEndpoint}`, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });
        const json = await res.json();
        
        // Data format adjust karo (results ya movies key check karo)
        const results = json.results || json.movies || [];
        
        return NextResponse.json({ results });
    } catch (e) {
        return NextResponse.json({ results: [] });
    }
}
