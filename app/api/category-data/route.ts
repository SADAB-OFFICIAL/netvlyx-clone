import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const page = searchParams.get('page') || '1';

    if (!slug) return NextResponse.json({ results: [] });

    console.log(`📡 Fetching Category: ${slug} | Page: ${page}`);

    try {
        // ============================================================
        // 🚀 CASE 1: MOVIESDRIVE SCRAPER (For 'Latest' & 'MoviesDrive')
        // ============================================================
        // Kyunki Netvlyx ki Latest API broken hai, hum MoviesDrive use karenge
        if (slug === 'latest' || slug === 'moviesdrive') {
            
            // MoviesDrive Pagination URL Pattern
            // Page 1: https://moviesdrive.forum/
            // Page 2: https://moviesdrive.forum/page/2/
            const targetUrl = page === '1' 
                ? 'https://moviesdrive.forum/' 
                : `https://moviesdrive.forum/page/${page}/`;

            console.log(`🚀 Scraping MDrive: ${targetUrl}`);

            const res = await fetch(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
                },
                next: { revalidate: 60 } // Cache for 1 minute
            });

            if (!res.ok) throw new Error("MDrive Scrape Failed");

            const html = await res.text();
            const $ = cheerio.load(html);
            const results: any[] = [];

            // MDrive Homepage/Page Selector (ul.recent-movies)
            $('ul.recent-movies li.thumb').each((i, el) => {
                const titleEl = $(el).find('figcaption p');
                const imgEl = $(el).find('figure img');
                const linkEl = $(el).find('figure a');

                const title = titleEl.text().trim();
                const image = imgEl.attr('src');
                const link = linkEl.attr('href');

                if (title && link) {
                    // Quality Detection
                    let quality = "HD";
                    if (title.includes('4k') || title.includes('2160p')) quality = '4K';
                    else if (title.includes('1080p')) quality = '1080p';
                    else if (title.includes('720p')) quality = '720p';

                    results.push({
                        title: title,
                        image: image,
                        link: link,
                        quality: quality,
                        rating: "N/A"
                    });
                }
            });

            return NextResponse.json({ results });
        }

        // ============================================================
        // 🌍 CASE 2: OFFICIAL API (For Categories like South, Bollywood)
        // ============================================================
        let targetEndpoint = "";

        switch (slug) {
            case 'bollywood': targetEndpoint = `/api/category/bollywood?page=${page}`; break;
            case 'hollywood': targetEndpoint = `/api/category/hollywood?page=${page}`; break;
            case 'south': targetEndpoint = `/api/category/south-hindi-movies?page=${page}`; break;
            case 'anime': targetEndpoint = `/api/category/anime?page=${page}`; break;
            case 'korean': targetEndpoint = `/api/category/korean?page=${page}`; break;
            default: return NextResponse.json({ results: [] });
        }

        const OFFICIAL_URL = `https://netvlyx.pages.dev${targetEndpoint}`;
        
        const res = await fetch(OFFICIAL_URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Referer": "https://netvlyx.pages.dev/"
            }
        });
        
        const json = await res.json();
        const rawItems = json.results || json.movies || json.data || [];
        
        // Data Normalization for Frontend
        const normalizedResults = rawItems.map((item: any) => ({
            title: item.title,
            image: item.image || item.poster || "", 
            link: item.link,
            quality: item.quality || "HD",
            rating: item.rating || "8.5"
        }));

        return NextResponse.json({ results: normalizedResults });

    } catch (e: any) {
        console.error("🔥 API Error:", e.message);
        return NextResponse.json({ results: [] });
    }
}
