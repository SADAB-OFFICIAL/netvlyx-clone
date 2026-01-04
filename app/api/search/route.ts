import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('s') || searchParams.get('q');

  if (!query) return NextResponse.json({ success: false, results: [] });

  try {
    const [officialRes, mdriveResults] = await Promise.all([
      // 1. Movies4u API (Official) - NO CHANGE
      fetch(`https://netvlyx.pages.dev/api/movies4u-search?s=${encodeURIComponent(query)}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Referer": "https://netvlyx.pages.dev/"
          },
          next: { revalidate: 0 }
      }).then(res => res.json()).catch(() => ({ results: [] })),

      // 2. MoviesDrive Scraper (With Deduplication Logic)
      searchMoviesDrive(query)
    ]);

    // --- DATA TAGGING ---
    
    // Movies4u Data -> Tag as 'server_2'
    const officialResults = (officialRes.results || []).map((item: any) => ({
        ...item,
        source: 'server_2' 
    }));
    
    // MoviesDrive Data -> Tag as 'server_1'
    const mdriveTagged = mdriveResults.map((item: any) => ({
        ...item,
        source: 'server_1'
    }));

    // Combine Both
    const finalResults = [...mdriveTagged, ...officialResults];

    return NextResponse.json({ 
        success: true, 
        results: finalResults 
    });

  } catch (error: any) {
    console.error("Search API Error:", error.message);
    return NextResponse.json({ success: false, results: [] });
  }
}

// --- HELPER: MoviesDrive Search + Deduplication Logic 🧠 ---
async function searchMoviesDrive(query: string) {
    try {
        const targetUrl = `https://moviesdrive.forum/?s=${encodeURIComponent(query)}`;
        const res = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const html = await res.text();
        const $ = cheerio.load(html);
        
        const rawResults: any[] = [];

        // 1. Scrape All Items (Raw)
        $('ul.recent-movies li.thumb').each((i, el) => {
            const titleEl = $(el).find('figcaption p');
            const imgEl = $(el).find('figure img');
            const linkEl = $(el).find('figure a');
            const title = titleEl.text().trim(); 
            const image = imgEl.attr('src');     
            const link = linkEl.attr('href');    

            if (title && link) {
                const qualityTags = [];
                if (title.includes('4k') || title.includes('2160p')) qualityTags.push('4K');
                if (title.includes('1080p')) qualityTags.push('1080p');
                if (title.includes('Hindi')) qualityTags.push('Hindi');

                rawResults.push({
                    title: title,
                    image: image,
                    link: link,
                    type: title.toLowerCase().includes('season') ? 'Series' : 'Movie',
                    quality: qualityTags.length > 0 ? qualityTags.join(" | ") : "HD"
                });
            }
        });

        // 2. SMART DEDUPLICATION LOGIC 🌟
        // Maqsad: Series ke multiple seasons ko remove karke ek dikhana
        
        const seenTitles = new Set();
        const uniqueResults = [];

        for (const item of rawResults) {
            // Clean Title banao (Season info hata kar)
            // Ex: "Game of Thrones Season 5" -> "game of thrones"
            const cleanBaseTitle = item.title
                .replace(/\s*(?:Season|S|Series)\s*0?\d+.*/i, "") // Remove 'Season 1' etc
                .replace(/\s*[\(\[]?Complete[\)\]]?/i, "") // Remove 'Complete'
                .replace(/\s*[\(\[]?Vol\s*\.?\s*\d+[\)\]]?/i, "") // Remove 'Vol 1'
                .trim()
                .toLowerCase();

            // Agar ye Series pehli baar dikhi hai -> Add karo
            // Agar ye Movie hai -> Hamesha Add karo (Movies duplicate nahi hoti usually)
            if (item.type === 'Movie' || !seenTitles.has(cleanBaseTitle)) {
                if(item.type === 'Series') seenTitles.add(cleanBaseTitle);
                uniqueResults.push(item);
            }
        }

        return uniqueResults;

    } catch (e) {
        return [];
    }
}
