import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q'); // Search Keyword

  if (!query) return NextResponse.json({ success: false, results: [] });

  try {
    // ---------------------------------------------------------
    // 🚀 PARALLEL SEARCHING (Dono sites ek saath)
    // ---------------------------------------------------------
    const [officialRes, mdriveRes] = await Promise.all([
      // 1. Movies4u (Official API)
      fetch(`https://netvlyx.pages.dev/api/search?q=${encodeURIComponent(query)}`, {
          headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Referer': 'https://netvlyx.pages.dev/'
          }
      }).then(res => res.json()).catch(() => ({ results: [] })),

      // 2. MoviesDrive (Custom Scraper)
      searchMoviesDrive(query)
    ]);

    // ---------------------------------------------------------
    // 🔄 MERGING RESULTS
    // ---------------------------------------------------------
    // Movies4u ka data safe nikalo
    const officialResults = officialRes.results || [];

    // MoviesDrive ka data safe nikalo
    const mdriveResults = mdriveRes || [];

    // Dono ko jod do (MoviesDrive ko upar ya niche rakh sakte ho)
    // Yahan maine mix kiya hai: Pehle MDrive, fir Official
    const finalResults = [...mdriveResults, ...officialResults];

    return NextResponse.json({ 
        success: true, 
        results: finalResults 
    });

  } catch (e) {
    console.error("Search Error:", e);
    return NextResponse.json({ success: false, error: "Search Failed" });
  }
}

// =========================================================
// 🕵️‍♂️ HELPER: MOVIESDRIVE SEARCH SCRAPER
// =========================================================
async function searchMoviesDrive(query: string) {
    try {
        // MDrive Search URL pattern
        const targetUrl = `https://moviesdrive.forum/?s=${encodeURIComponent(query)}`;
        
        const res = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const html = await res.text();
        const $ = cheerio.load(html);
        const results: any[] = [];

        // Structure wahi hai jo Home Page par tha (ul.recent-movies)
        $('ul.recent-movies li.thumb').each((i, el) => {
            const titleEl = $(el).find('figcaption p');
            const imgEl = $(el).find('figure img');
            const linkEl = $(el).find('figure a');

            const title = titleEl.text().trim();
            const image = imgEl.attr('src');
            const link = linkEl.attr('href');

            // Quality Detection (Title se)
            const qualityTags = [];
            if (title.includes('4k') || title.includes('2160p')) qualityTags.push('4K');
            if (title.includes('1080p')) qualityTags.push('1080p');
            if (title.includes('Dubbed') || title.includes('Hindi')) qualityTags.push('Hindi');

            if (title && link) {
                results.push({
                    title: title,
                    image: image,
                    link: link, // Ye link seedha /api/resolve-link handle karega (MDrive detection ke saath)
                    type: title.toLowerCase().includes('season') ? 'Series' : 'Movie',
                    quality: qualityTags.length > 0 ? qualityTags.join(" | ") : "HD"
                });
            }
        });

        return results;

    } catch (e) {
        console.error("MDrive Search Error:", e);
        return []; // Agar fail ho jaye to empty array bhejo, taaki poora search na ruk jaye
    }
}
