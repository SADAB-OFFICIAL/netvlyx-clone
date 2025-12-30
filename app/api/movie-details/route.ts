import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    if (url.includes('moviesdrive') || url.includes('mdrive')) {
        return await scrapeMoviesDrive(url);
    } else {
        return await fetchOfficialApiData(url);
    }
  } catch (error) {
    console.error("Scraping Error:", error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// =====================================================================
// 🟢 OFFICIAL API LOGIC (No Changes)
// =====================================================================
async function fetchOfficialApiData(targetUrl: string) {
    const targetApi = `https://netvlyx.pages.dev/api/m4ulinks-scraper?url=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(targetApi, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 }
    });

    let data: any = { title: "Unknown", linkData: [], description: "", screenshots: [] };
    if (response.ok) { try { data = await response.json(); } catch (e) {} }

    const cleanStrongTitle = (rawText: string) => {
        if (!rawText) return "";
        let text = rawText.replace(/-/g, ' ');
        const splitRegex = /[\(\[\.]|Season|S\d+|Ep\d+|\b\d{4}\b/i;
        return text.split(splitRegex)[0].trim().replace(/\b\w/g, (l) => l.toUpperCase());
    };

    let finalTitle = cleanStrongTitle(data.title);
    let releaseYear = null;

    if (!finalTitle || finalTitle.length < 2 || finalTitle.toLowerCase().includes('unknown')) {
        try {
            const slug = new URL(targetUrl).pathname.split('/').filter(Boolean).pop() || "";
            const yearMatch = slug.match(/-(\d{4})-/);
            if (yearMatch) releaseYear = yearMatch[1];
            finalTitle = cleanStrongTitle(slug);
        } catch (e) { finalTitle = "Unknown Movie"; }
    }

    const downloadSections = (data.linkData || []).map((item: any) => {
        let season = null;
        const sMatch = (item.quality || "").match(/(?:Season|S)\s*0?(\d+)/i);
        if (sMatch) season = parseInt(sMatch[1]);

        let quality = (item.quality || "Standard").replace(/\s*\[.*?\]/g, "").trim();
        if (quality.match(/4k|2160p/i)) quality = '4K';
        else if (quality.match(/1080p/i)) quality = '1080p';
        else if (quality.match(/720p/i)) quality = '720p';
        else if (quality.match(/480p/i)) quality = '480p';

        return {
            title: item.quality,
            quality: quality,
            size: item.size,
            season: season,
            links: (item.links || []).map((l: any) => ({
                label: l.name || 'Download Server',
                url: l.url,
                isZip: /pack|zip|batch/i.test(item.quality || "") || /zip|pack/i.test(l.name || "")
            }))
        };
    });

    const allSeasons = new Set<number>();
    downloadSections.forEach((sec: any) => { if (sec.season) allSeasons.add(sec.season); });
    
    return NextResponse.json({
        title: finalTitle,
        year: releaseYear,
        poster: data.image || data.poster || "",
        plot: data.description || data.plot || "Overview unavailable.",
        seasons: Array.from(allSeasons).sort((a, b) => a - b),
        screenshots: (data.screenshots || []).slice(0, 8),
        downloadSections: downloadSections
    });
}

// =====================================================================
// 🟢 MOVIESDRIVE FIXED SCRAPER (Strict Series Check Added)
// =====================================================================
async function scrapeMoviesDrive(targetUrl: string) {
    const res = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 1. Basic Info
    const rawTitle = $('h1.entry-title, h1.page-title').text().trim(); // Improved selector
    let title = rawTitle.replace(/^Download\s+/i, '').split(/[\(\[]/)[0].trim();
    
    const yearMatch = rawTitle.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[1] : null;

    const poster = $('.entry-content img, .page-body img').first().attr('src') || '';
    
    // --- 🛑 STRICT SERIES MODE CHECK ---
    // Agar Title mein "Season" ya "Series" nahi hai, to ye 100% Movie hai.
    // Hum neeche "season" detection tabhi karenge jab ye flag true ho.
    const isSeries = /Season|Series|S\d+/i.test(rawTitle);

    let plot = "Overview unavailable.";
    $('h3, h4').each((i, el) => {
        if ($(el).text().toLowerCase().includes('story')) {
            plot = $(el).nextAll('p, div').first().text().trim();
        }
    });

    const screenshots: string[] = [];
    $('center img, .entry-content img').each((i, el) => {
        const src = $(el).attr('src');
        if (src && !src.includes('icon') && src !== poster) screenshots.push(src);
    });

    // Link Extraction
    const downloadSections: any[] = [];
    const processedUrls = new Set();
    const allSeasons = new Set<number>();

    // Use specific content selector to avoid sidebar
    $('.entry-content a, .page-body a').each((i, el) => {
        const link = $(el).attr('href');
        let text = $(el).text().trim();
        
        if (link && (link.includes('mdrive') || link.includes('drive') || link.includes('archives')) && !processedUrls.has(link)) {
            
            // Context Analysis
            let contextText = text;
            const parentHeader = $(el).closest('h5, p, h3');
            const prevHeader = parentHeader.prev('h5, p, h3, h4');
            if (prevHeader.length) contextText += " " + prevHeader.text();

            // Quality
            let quality = "HD";
            if (contextText.match(/4k|2160p/i)) quality = '4K';
            else if (contextText.match(/1080p/i)) quality = '1080p';
            else if (contextText.match(/720p/i)) quality = '720p';
            else if (contextText.match(/480p/i)) quality = '480p';

            const sizeMatch = contextText.match(/\[(\d+(\.\d+)?\s?(MB|GB))\]/i);
            const size = sizeMatch ? sizeMatch[1] : "";

            // --- FIXED SEASON LOGIC ---
            let season = null;
            
            // Sirf tabhi check karo agar Title ne confirm kiya ho ki ye Series hai
            if (isSeries) {
                // Pehle context se try karo
                let sMatch = contextText.match(/(?:Season|S)\s*0?(\d+)/i);
                // Agar wahan nahi mila, to Title se fallback lo
                if (!sMatch) sMatch = rawTitle.match(/(?:Season|S)\s*0?(\d+)/i);
                
                if (sMatch) {
                    season = parseInt(sMatch[1]);
                    allSeasons.add(season);
                }
            }
            // Agar isSeries false hai (e.g. Pathaan), to season hamesha null rahega

            processedUrls.add(link);
            downloadSections.push({
                title: isSeries ? `S${season} ${quality}` : `Download ${quality}`,
                quality: quality,
                size: size,
                season: season,
                links: [{
                    label: text || "Download Link",
                    url: link,
                    isZip: contextText.toLowerCase().includes('zip')
                }]
            });
        }
    });

    return NextResponse.json({
        title: title,
        year: year,
        poster: poster,
        plot: plot,
        seasons: Array.from(allSeasons).sort((a, b) => a - b), // Empty for movies
        screenshots: screenshots.slice(0, 8),
        downloadSections: downloadSections
    });
}
