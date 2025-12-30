import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // ---- DECISION MAKER: KONSA ENGINE USE KARNA HAI? ----
    if (url.includes('moviesdrive') || url.includes('mdrive')) {
        // Engine 2: MoviesDrive Scraper (Direct HTML Parsing)
        return await scrapeMoviesDrive(url);
    } else {
        // Engine 1: Official Netvlyx API (Default for Movies4u etc.)
        return await fetchOfficialApiData(url);
    }

  } catch (error) {
    console.error("Scraping Error:", error);
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}

// =====================================================================
// 🟢 ENGINE 1: OFFICIAL NETVLYX API LOGIC (For Movies4u)
// =====================================================================
async function fetchOfficialApiData(targetUrl: string) {
    const targetApi = `https://netvlyx.pages.dev/api/m4ulinks-scraper?url=${encodeURIComponent(targetUrl)}`;
    
    const response = await fetch(targetApi, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://netvlyx.pages.dev/',
        'Origin': 'https://netvlyx.pages.dev'
      },
      next: { revalidate: 300 }
    });

    let data: any = { title: "Unknown", linkData: [], description: "", screenshots: [] };
    if (response.ok) {
        try { 
            const jsonData = await response.json();
            data = { ...data, ...jsonData };
        } catch (e) {}
    }

    // --- STRONG TITLE LOGIC ---
    const cleanStrongTitle = (rawText: string) => {
        if (!rawText) return "";
        let text = rawText.replace(/-/g, ' ');
        const splitRegex = /[\(\[\.]|Season|S\d+|Ep\d+|\b\d{4}\b/i;
        let cleanPart = text.split(splitRegex)[0];
        cleanPart = cleanPart.trim();
        return cleanPart.replace(/\b\w/g, (l) => l.toUpperCase());
    };

    let finalTitle = cleanStrongTitle(data.title);
    let releaseYear = null;

    if (!finalTitle || finalTitle.length < 2 || finalTitle.toLowerCase().includes('unknown')) {
        try {
            const slug = new URL(targetUrl).pathname.split('/').filter(Boolean).pop() || "";
            const yearMatch = slug.match(/-(\d{4})-/);
            if (yearMatch) releaseYear = yearMatch[1];
            finalTitle = cleanStrongTitle(slug);
        } catch (e) {
            finalTitle = "Unknown Movie";
        }
    }

    // --- PROCESS LINKS ---
    const downloadSections = (data.linkData || []).map((item: any) => {
        let season = null;
        const sMatch = (item.quality || "").match(/(?:Season|S)\s*0?(\d+)/i);
        if (sMatch) season = parseInt(sMatch[1]);

        let quality = (item.quality || "Standard").replace(/\s*\[.*?\]/g, "").trim();
        if (quality.match(/4k|2160p/i)) quality = '4K';
        else if (quality.match(/1080p/i)) quality = '1080p';
        else if (quality.match(/720p/i)) quality = '720p';
        else if (quality.match(/480p/i)) quality = '480p';

        const sectionIsPack = /pack|zip|batch|complete|collection|volume/i.test(item.quality || "");

        return {
            title: item.quality,
            quality: quality,
            size: item.size,
            season: season,
            links: (item.links || []).map((l: any) => ({
                label: l.name || 'Download Server',
                url: l.url,
                isZip: sectionIsPack || /zip|pack|batch/i.test(l.name || "")
            }))
        };
    });

    const allSeasons = new Set<number>();
    downloadSections.forEach((sec: any) => { if (sec.season) allSeasons.add(sec.season); });
    
    if (allSeasons.size === 0) {
        const titleRange = (data.title || "").match(/(?:Season|S)\s*(\d+)\s*[-–—]\s*(\d+)/i);
        if (titleRange) {
            for (let i = parseInt(titleRange[1]); i <= parseInt(titleRange[2]); i++) allSeasons.add(i);
        }
    }

    let screenshots = Array.isArray(data.screenshots || data.images) ? (data.screenshots || data.images) : [];

    return NextResponse.json({
        title: finalTitle,
        year: releaseYear,
        poster: data.image || data.poster || "",
        plot: data.description || data.plot || "Overview unavailable.",
        imdbId: null, 
        seasons: Array.from(allSeasons).sort((a, b) => a - b),
        screenshots: screenshots.slice(0, 8),
        downloadSections: downloadSections
    });
}

// =====================================================================
// 🟢 ENGINE 2: MOVIESDRIVE CUSTOM SCRAPER
// =====================================================================
async function scrapeMoviesDrive(targetUrl: string) {
    const res = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 1. Title & Year Parsing
    const rawTitle = $('h1.page-title .material-text').text().trim();
    // Strong Title Logic apply here too
    let title = rawTitle.replace(/^Download\s+/i, '').split(/[\(\[]/)[0].trim(); // "Dhurandhar"
    
    const yearMatch = rawTitle.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[1] : null;

    // 2. Poster & Plot
    const poster = $('.page-body img.aligncenter').attr('src') || '';
    
    let plot = "Overview unavailable.";
    $('h3').each((i, el) => {
        if ($(el).text().includes('Storyline')) {
            // Find the next div or text container
            const nextDiv = $(el).nextAll('div, p').first().text().trim();
            if (nextDiv) plot = nextDiv;
        }
    });

    // 3. Screenshots
    const screenshots: string[] = [];
    $('center img, .page-body img').each((i, el) => {
        const src = $(el).attr('src');
        if (src && !src.includes('t.jpg') && src !== poster) { // Exclude icons/poster
            screenshots.push(src);
        }
    });

    // 4. Link Extraction
    const downloadSections: any[] = [];
    const processedUrls = new Set();
    const allSeasons = new Set<number>();

    // MoviesDrive par links usually 'h5 > a' ya 'p > a' mein hote hain with strong tags
    // Hum specific pattern dhundenge
    $('a').each((i, el) => {
        const link = $(el).attr('href');
        const text = $(el).text().trim(); // e.g. "480p x264 [688.21 MB]" or "Download 720p"
        
        // Filter valid drive links
        if (link && (link.includes('mdrive') || link.includes('drive') || link.includes('archives')) && !processedUrls.has(link)) {
            
            // Context Analysis (Heading or Previous Element for more info)
            // MoviesDrive structure: <h5>Title details</h5> <h5><a href>Link</a></h5>
            let contextText = text;
            const parentHeader = $(el).closest('h5, p, h3');
            const prevHeader = parentHeader.prev('h5, p, h3, h4');
            if (prevHeader.length) contextText += " " + prevHeader.text();

            // Quality Detection
            let quality = "HD";
            if (contextText.match(/4k|2160p/i)) quality = '4K';
            else if (contextText.match(/1080p/i)) quality = '1080p';
            else if (contextText.match(/720p/i)) quality = '720p';
            else if (contextText.match(/480p/i)) quality = '480p';

            // Size Detection
            const sizeMatch = contextText.match(/\[(\d+(\.\d+)?\s?(MB|GB))\]/i);
            const size = sizeMatch ? sizeMatch[1] : "";

            // Season Detection
            let season = null;
            const sMatch = (contextText + rawTitle).match(/(?:Season|S)\s*0?(\d+)/i);
            if (sMatch) {
                season = parseInt(sMatch[1]);
                allSeasons.add(season);
            }

            // Grouping Logic (Simplified: One section per link for robustness, UI handles grouping)
            if (!processedUrls.has(link)) {
                processedUrls.add(link);
                downloadSections.push({
                    title: `Download ${quality}`,
                    quality: quality,
                    size: size,
                    season: season,
                    links: [{
                        label: text || "Download Link",
                        url: link,
                        isZip: contextText.toLowerCase().includes('zip') || contextText.toLowerCase().includes('pack')
                    }]
                });
            }
        }
    });

    // 5. Return Unified Format
    return NextResponse.json({
        title: title,
        year: year,
        poster: poster,
        plot: plot,
        imdbId: null,
        seasons: Array.from(allSeasons).sort((a, b) => a - b),
        screenshots: screenshots.slice(0, 8),
        downloadSections: downloadSections
    });
}
