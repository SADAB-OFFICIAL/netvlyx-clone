import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) return NextResponse.json({ success: false, results: [] });

  try {
    console.log(`🔍 Searching for: ${query}`);

    // --- PARALLEL SEARCHING ---
    const [officialRes, mdriveResults] = await Promise.all([
      // 1. Movies4u (Official API)
      fetch(`https://netvlyx.pages.dev/api/search?q=${encodeURIComponent(query)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
      }).then(res => res.json()).catch(e => {
          console.error("❌ Movies4u API Error:", e.message);
          return { results: [] };
      }),

      // 2. MoviesDrive (Custom Scraper)
      searchMoviesDrive(query)
    ]);

    // Data Extraction
    const officialResults = officialRes.results || [];
    
    // Console pe check karo ki data aaya ya nahi
    console.log(`✅ Movies4u Found: ${officialResults.length}`);
    console.log(`✅ MoviesDrive Found: ${mdriveResults.length}`);

    // Merge Results
    const finalResults = [...mdriveResults, ...officialResults];

    return NextResponse.json({ 
        success: true, 
        results: finalResults 
    });

  } catch (e) {
    console.error("🔥 Global Search Error:", e);
    return NextResponse.json({ success: false, error: "Search Failed" });
  }
}

// =========================================================
// 🕵️‍♂️ HELPER: MOVIESDRIVE SEARCH SCRAPER (Updated)
// =========================================================
async function searchMoviesDrive(query: string) {
    try {
        const targetUrl = `https://moviesdrive.forum/?s=${encodeURIComponent(query)}`;
        console.log(`🚀 Requesting MDrive: ${targetUrl}`);

        const res = await fetch(targetUrl, {
            headers: {
                // Ye headers Browser banne ka natak karte hain
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://moviesdrive.forum/',
                'Upgrade-Insecure-Requests': '1'
            },
            cache: 'no-store'
        });

        // Debugging: Check karo status code kya hai
        if (!res.ok) {
            console.error(`⚠️ MDrive Blocked/Error! Status: ${res.status}`);
            return [];
        }

        const html = await res.text();
        
        // Debugging: Check karo HTML aaya bhi hai ya nahi
        // Agar length < 5000 hai, to samajh lo Captcha page hai
        console.log(`📄 MDrive HTML Length: ${html.length}`); 

        const $ = cheerio.load(html);
        const results: any[] = [];

        // --- SELECTORS BASED ON YOUR 'search.html' ---
        // Container: ul.recent-movies
        // Item: li.thumb
        $('ul.recent-movies li.thumb').each((i, el) => {
            const titleEl = $(el).find('figcaption p');
            const imgEl = $(el).find('figure img');
            const linkEl = $(el).find('figure a');

            const title = titleEl.text().trim(); // "Jawan (2023)..."
            const image = imgEl.attr('src');     // "https://image.tmdb..."
            const link = linkEl.attr('href');    // "https://moviesdrive..."

            if (title && link) {
                // Quality Tags Detection
                const qualityTags = [];
                if (title.includes('4k') || title.includes('2160p')) qualityTags.push('4K');
                if (title.includes('1080p')) qualityTags.push('1080p');
                if (title.includes('Dubbed') || title.includes('Hindi')) qualityTags.push('Hindi');

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

    } catch (e: any) {
        console.error("❌ MDrive Scraper Logic Error:", e.message);
        return [];
    }
}
