import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const page = searchParams.get('page') || '1';

    if (!slug) return NextResponse.json({ results: [] });

    console.log(`📡 Fetching Category: ${slug} | Page: ${page}`);

    // --- SLUG MAPPING ---
    let targetEndpoint = "";
    
    // MoviesDrive ka logic alag hai (Scraping needed), filhal empty return karega
    if (slug === 'moviesdrive') {
        return NextResponse.json({ results: [] }); 
    }

    // Official Categories mapping
    switch (slug) {
        case 'latest': targetEndpoint = `/api/category/latest?page=${page}`; break;
        case 'bollywood': targetEndpoint = `/api/category/bollywood?page=${page}`; break;
        case 'hollywood': targetEndpoint = `/api/category/hollywood?page=${page}`; break;
        case 'south': targetEndpoint = `/api/category/south-hindi-movies?page=${page}`; break;
        case 'anime': targetEndpoint = `/api/category/anime?page=${page}`; break;
        case 'korean': targetEndpoint = `/api/category/korean?page=${page}`; break;
        default: 
            // Agar koi unknown slug aa jaye
            console.log("⚠️ Unknown Slug:", slug);
            return NextResponse.json({ results: [] });
    }

    try {
        const TARGET_URL = `https://netvlyx.pages.dev${targetEndpoint}`;
        
        // Headers bohot zaroori hain (Browser banne ka natak)
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://netvlyx.pages.dev/",
            "Origin": "https://netvlyx.pages.dev"
        };

        const res = await fetch(TARGET_URL, { headers, next: { revalidate: 300 } });
        
        if (!res.ok) {
            console.error(`❌ API Failed: ${res.status} for ${TARGET_URL}`);
            return NextResponse.json({ results: [] });
        }

        const json = await res.json();
        
        // Data Extraction (Har endpoint alag key use kar sakta hai)
        // Kabhi 'results', kabhi 'movies', kabhi 'data'
        const finalResults = json.results || json.movies || json.data || [];
        
        console.log(`✅ Success: Found ${finalResults.length} items for ${slug}`);

        return NextResponse.json({ results: finalResults });

    } catch (e: any) {
        console.error("🔥 Category API Error:", e.message);
        return NextResponse.json({ results: [] });
    }
}
