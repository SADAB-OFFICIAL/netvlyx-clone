import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // ---- ENGINE SWITCHER ----
    if (url.includes('moviesdrive') || url.includes('mdrive')) {
        return await scrapeMoviesDrive(url);
    } else {
        return await fetchOfficialApiData(url);
    }

  } catch (error) {
    console.error("Scraping Error:", error);
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}

// =====================================================================
// 🟢 ENGINE 1: OFFICIAL NETVLYX API (Same as your working code)
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

    const cleanStrongTitle = (rawText: string) => {
        if (!rawText) return "";
        let text = rawText.replace(/-/g, ' ');
        const splitRegex = /[\(\[\.]|Season|S\d+|Ep\d+|\b\d{4}\b/i;
        let cleanPart = text.split(splitRegex)[0].trim();
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
                isZip: /pack|zip|batch/i.test(item.quality || "")
            }))
        };
    });

    const allSeasons = new Set<number>();
    downloadSections.forEach((sec: any) => { if (sec.season) allSeasons.add(sec.season); });
    
    // Screenshot fallback
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
// 🟢 ENGINE 2: MOVIESDRIVE SMART SCRAPER (Updated & Fixed)
// =====================================================================
async function scrapeMoviesDrive(targetUrl: string) {
    const res = await fetch(targetUrl, {
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
        }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 1. Selector for Main Content (Avoids sidebar/footer)
    const content = $('.page-body, .entry-content').first();

    // 2. Title & Year
    const rawTitle = $('h1.page-title, h1.entry-title').text().trim();
    let title = rawTitle.replace(/^Download\s+/i, '').split(/[\(\[]/)[0].trim();
    
    const yearMatch = rawTitle.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[1] : null;

    // 3. Poster
    const poster = content.find('img').first().attr('src') || '';

    // 4. Rating (Regex se dhundna)
    let rating = "N/A";
    const bodyText = content.text();
    const ratingMatch = bodyText.match(/IMDb Rating:?\s*(\d+(\.\d+)?)/i) || bodyText.match(/Rating:?\s*(\d+(\.\d+)?)\/10/i);
    if (ratingMatch) rating = ratingMatch[1];

    // 5. Screenshots (Fix: Collect valid images only)
    const screenshots: string[] = [];
    content.find('img').each((i, el) => {
        const src = $(el).attr('src');
        // Filter out poster, icons, and small images
        if (src && src !== poster && !src.includes('icon') && !src.includes('button')) {
            screenshots.push(src);
        }
    });

    // 6. SERIES vs MOVIE LOGIC (Strict Mode)
    // Agar Title mein "Season" ya "Series" hai, tabhi Season detect karo.
    const isSeriesTitle = /Season|Series|S\d+/i.test(rawTitle);

    // 7. Links & Context Extraction
    const downloadSections: any[] = [];
    const processedUrls = new Set();
    const allSeasons = new Set<number>();

    // Headers aur Links dono ko sequence mein padho
    let currentSeason: number | null = null;
    let currentQuality = "HD";

    content.find('h3, h4, h5, p, div').each((i, el) => {
        const text = $(el).text().trim();
        const tag = $(el).prop('tagName').toLowerCase();

        // A. Header Handling (Set Context)
        if (['h3', 'h4', 'h5'].includes(tag)) {
            // Quality Detection
            if (text.includes('480p')) currentQuality = '480p';
            else if (text.includes('720p')) currentQuality = '720p';
            else if (text.includes('1080p')) currentQuality = '1080p';
            else if (text.includes('4k') || text.includes('2160p')) currentQuality = '4K';

            // Season Detection (Sirf tab jab Series ho)
            if (isSeriesTitle) {
                const sMatch = text.match(/(?:Season|S)\s*0?(\d+)/i);
                if (sMatch) currentSeason = parseInt(sMatch[1]);
            } else {
                currentSeason = null; // Movie hai to season reset karo
            }
        }

        // B. Link Handling
        const linkEl = $(el).find('a').first();
        const href = linkEl.attr('href');
        const linkText = linkEl.text().trim() || text;

        if (href && (href.includes('mdrive') || href.includes('drive') || href.includes('archives')) && !processedUrls.has(href)) {
            
            // Backup context check from Link Text itself
            let finalQuality = currentQuality;
            if (linkText.includes('480p')) finalQuality = '480p';
            else if (linkText.includes('720p')) finalQuality = '720p';
            else if (linkText.includes('1080p')) finalQuality = '1080p';
            else if (linkText.includes('4k')) finalQuality = '4K';

            let finalSeason = currentSeason;
            if (isSeriesTitle && !finalSeason) {
                const linkSMatch = linkText.match(/(?:Season|S)\s*0?(\d+)/i);
                if (linkSMatch) finalSeason = parseInt(linkSMatch[1]);
            }

            if (finalSeason) allSeasons.add(finalSeason);

            processedUrls.add(href);
            downloadSections.push({
                title: isSeriesTitle && finalSeason ? `Season ${finalSeason} - ${finalQuality}` : `Download ${finalQuality}`,
                quality: finalQuality,
                size: linkText.match(/\[(\d+(\.\d+)?\s?(MB|GB))\]/i)?.[1] || "N/A",
                season: finalSeason,
                links: [{
                    label: "Download Link",
                    url: href,
                    isZip: linkText.toLowerCase().includes('zip') || linkText.toLowerCase().includes('pack')
                }]
            });
        }
    });

    return NextResponse.json({
        title: title,
        year: year,
        poster: poster,
        plot: "Overview unavailable.", // Plot usually requires more complex scraping, title serves well for now
        rating: rating, // Added Rating
        imdbId: null,
        seasons: Array.from(allSeasons).sort((a, b) => a - b),
        screenshots: screenshots.slice(0, 8),
        downloadSections: downloadSections
    });
}
