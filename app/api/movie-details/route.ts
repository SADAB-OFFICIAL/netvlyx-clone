import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ success: false, error: 'URL Missing' });

  try {
    // ---- 1. CHECK SOURCE (MoviesDrive vs Movies4u) ----
    if (url.includes('moviesdrive') || url.includes('mdrive')) {
        return await scrapeMoviesDrive(url);
    } else {
        // Aapka purana Movies4u logic yahan aayega (ya existing function)
        // Filhal main MoviesDrive ka return kar raha hoon
        return await scrapeMovies4u(url); 
    }

  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Server Error' });
  }
}

// ---------------------------------------------------------
// 🟢 MOVIESDRIVE SCRAPER (New)
// ---------------------------------------------------------
async function scrapeMoviesDrive(targetUrl: string) {
    const res = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 1. Basic Info
    const rawTitle = $('h1.page-title .material-text').text().trim();
    const title = rawTitle.replace('Download', '').trim(); // Clean Title
    const yearMatch = title.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[1] : null;
    
    const poster = $('.page-body img.aligncenter').attr('src') || '';
    
    // Plot Logic (Storyline header ke baad wala div)
    let plot = "Overview unavailable.";
    $('h3').each((i, el) => {
        if ($(el).text().includes('Storyline')) {
            plot = $(el).next('div').text().trim();
        }
    });

    // IMDb Logic
    const imdbIdMatch = $('a[href*="imdb.com/title/"]').attr('href')?.match(/tt\d+/);
    const imdbId = imdbIdMatch ? imdbIdMatch[0] : null;

    // Screenshots
    const screenshots: string[] = [];
    $('center img').each((i, el) => {
        const src = $(el).attr('src');
        if (src) screenshots.push(src);
    });

    // -----------------------------------------------------
    // 🔗 LINK EXTRACTION LOGIC (The Main Part)
    // -----------------------------------------------------
    const downloadSections: any[] = [];
    const processedUrls = new Set(); // Duplicates rokne ke liye

    // MoviesDrive par links aksar <h5> tags mein hote hain
    $('h5 a').each((i, el) => {
        const link = $(el).attr('href');
        const text = $(el).text().trim(); // Example: "480p x264 [688.21 MB]"
        
        // Filter: Sirf kaam ke links uthao (Drive links)
        if (link && (link.includes('drive') || link.includes('archives')) && !processedUrls.has(link)) {
            processedUrls.add(link);

            // Detect Quality
            let quality = "HD";
            if (text.includes('480p')) quality = "480p";
            else if (text.includes('720p')) quality = "720p";
            else if (text.includes('1080p')) quality = "1080p";
            else if (text.includes('4K') || text.includes('2160p')) quality = "4K";

            // Detect Size (Bracket [xx MB] wala part)
            const sizeMatch = text.match(/\[(\d+(\.\d+)?\s?(MB|GB))\]/i);
            const size = sizeMatch ? sizeMatch[1] : "N/A";

            // Add to Sections
            downloadSections.push({
                title: `${title} ${quality}`, // Title for UI
                quality: quality,
                size: size,
                season: null, // Movies ke liye null, Series ke liye logic alag hoga
                links: [
                    {
                        label: "Download / Watch",
                        url: link,
                        isZip: text.toLowerCase().includes('zip') || text.toLowerCase().includes('batch')
                    }
                ]
            });
        }
    });

    // 3. Final JSON Structure (Existing UI Compatible)
    return NextResponse.json({
        title: title,
        year: year,
        poster: poster,
        plot: plot,
        imdbId: imdbId,
        seasons: [], // Filhal movie hai to empty
        screenshots: screenshots,
        downloadSections: downloadSections
    });
}

// ---------------------------------------------------------
// 🟠 OLD MOVIES4U SCRAPER (Existing Logic)
// ---------------------------------------------------------
async function scrapeMovies4u(targetUrl: string) {
    // ... Yahan aapka purana logic aayega jo pehle se file mein tha
    // Main ise short mein likh raha hu taaki code lamba na ho
    // Aap apna purana code yahan copy-paste kar lena
    return NextResponse.json({ error: "Use existing logic here" });
}
