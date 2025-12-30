import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const page = searchParams.get('page') || '1';

    if (!slug) return NextResponse.json({ results: [] });

    console.log(`📡 Fetching Category: ${slug} | Page: ${page}`);

    // --- 1. SLUG MAPPING ---
    let targetEndpoint = "";
    
    if (slug === 'moviesdrive') {
        return NextResponse.json({ results: [] }); 
    }

    switch (slug) {
        case 'latest': targetEndpoint = `/api/category/latest?page=${page}`; break;
        case 'bollywood': targetEndpoint = `/api/category/bollywood?page=${page}`; break;
        case 'hollywood': targetEndpoint = `/api/category/hollywood?page=${page}`; break;
        case 'south': targetEndpoint = `/api/category/south-hindi-movies?page=${page}`; break; // ✅ Checked via Python
        case 'anime': targetEndpoint = `/api/category/anime?page=${page}`; break;
        case 'korean': targetEndpoint = `/api/category/korean?page=${page}`; break;
        default: return NextResponse.json({ results: [] });
    }

    try {
        const TARGET_URL = `https://netvlyx.pages.dev${targetEndpoint}`;
        
        // Headers (Jo Python script mein confirm huye hain)
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://netvlyx.pages.dev/",
            "Origin": "https://netvlyx.pages.dev"
        };

        const res = await fetch(TARGET_URL, { headers, next: { revalidate: 300 } });
        
        if (!res.ok) {
            console.error(`❌ API Failed: ${res.status}`);
            return NextResponse.json({ results: [] });
        }

        const json = await res.json();
        
        // --- 2. INTELLIGENT DATA EXTRACTION ---
        // Python output ne bataya ki South movies 'movies' key mein hain.
        // Baaki categories 'results' mein ho sakti hain.
        // Hum priority check lagayenge.
        const rawItems = json.movies || json.results || json.data || [];
        
        console.log(`✅ Extracted ${rawItems.length} items from API`);

        // --- 3. DATA NORMALIZATION (Frontend ke liye safai) ---
        // Frontend expect karta hai: { title, image, link, quality }
        // Python output mein 'image' field hai, frontend 'image' ya 'poster' dono handle karta hai.
        const normalizedResults = rawItems.map((item: any) => ({
            title: item.title,
            // Agar 'image' hai to wo lo, nahi to 'poster', nahi to empty
            image: item.image || item.poster || "", 
            link: item.link,
            // Quality and Rating default add kar rahe hain agar API se na aaye
            quality: item.quality || "HD",
            rating: item.rating || "8.5"
        }));

        // Frontend hamesha 'results' key expect karta hai
        return NextResponse.json({ results: normalizedResults });

    } catch (e: any) {
        console.error("🔥 Category API Error:", e.message);
        return NextResponse.json({ results: [] });
    }
}
