import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // FIX: 's' (jo aap use karte ho) aur 'q' (standard) dono check karo
  const query = searchParams.get('s') || searchParams.get('q');

  if (!query) return NextResponse.json({ success: false, results: [] });

  try {
    // --- PARALLEL SEARCHING (Dono sources se data lao) ---
    const [officialRes, mdriveResults] = await Promise.all([
      // 1. Official Movies4u API (Aapka purana working logic)
      fetch(`https://netvlyx.pages.dev/api/movies4u-search?s=${encodeURIComponent(query)}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://netvlyx.pages.dev/"
          },
          next: { revalidate: 0 } // No cache for search
      }).then(res => res.json()).catch(() => ({ results: [] })),

      // 2. MoviesDrive Scraper (Local)
      searchMoviesDrive(query)
    ]);

    // --- DATA MERGING ---
    // Movies4u ka data 'results' key mein hota hai
    const officialResults = officialRes.results || [];
    
    // Dono ko mix kar do (MoviesDrive + Movies4u)
    const finalResults = [...mdriveResults, ...officialResults];

    return NextResponse.json({ 
        success: true, 
        results: finalResults 
    });

  } catch (error: any) {
    console.error("Search API Error:", error.message);
    return NextResponse.json({ success: false, results: [] });
  }
}

// =========================================================
// 🕵️‍♂️ HELPER: MOVIESDRIVE SCRAPER (Based on your HTML)
// =========================================================
async function searchMoviesDrive(query: string) {
    try {
        // MoviesDrive search URL pattern
        const targetUrl = `https://moviesdrive.forum/?s=${encodeURIComponent(query)}`;
        
        const res = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            cache: 'no-store'
        });

        // Agar response nahi mila, toh empty bhej do (Crash mat karo)
        if (!res.ok) return [];

        const html = await res.text();
        const $ = cheerio.load(html);
        const results: any[] = [];

        // Selectors jo aapke 'search.html' mein confirm hue hain
        $('ul.recent-movies li.thumb').each((i, el) => {
            const titleEl = $(el).find('figcaption p');
            const imgEl = $(el).find('figure img');
            const linkEl = $(el).find('figure a');

            const title = titleEl.text().trim(); 
            const image = imgEl.attr('src');     
            const link = linkEl.attr('href');    

            // Data Validate karo
            if (title && link) {
                // Quality Tags detect karo title se
                const qualityTags = [];
                if (title.includes('4k') || title.includes('2160p')) qualityTags.push('4K');
                if (title.includes('1080p')) qualityTags.push('1080p');
                if (title.includes('Hindi')) qualityTags.push('Hindi');

                results.push({
                    title: title,
                    image: image,
                    link: link,
                    type: title.toLowerCase().includes('season') ? 'Series' : 'Movie',
                    quality: qualityTags.length > 0 ? qualityTags.join(" | ") : "HD"
                });
            }
        });

        return results;

    } catch (e) {
        console.error("MDrive Scraper Error:", e);
        return [];
    }
}
