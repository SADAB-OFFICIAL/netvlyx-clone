import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

    try {
        // ---- ENGINE SWITCHER ----
        // 1. MoviesDrive
        if (url.includes('moviesdrive') || url.includes('mdrive')) {
            return await scrapeMoviesDrive(url);
        }
        // 2. Movies4u
        else if (url.includes('movies4u') || url.includes('movie4u') || url.includes('m4u') || url.includes('fans') || url.includes('forex')) {
            try {
                return await scrapeMovies4u(url);
            } catch (e) {
                console.error("M4U Scrape Failed:", e);
                return await fetchOfficialApiData(url);
            }
        }
        // 3. Fallback
        else {
            return await fetchOfficialApiData(url);
        }

    } catch (error) {
        console.error("Global Scraping Error:", error);
        return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
    }
}

// =====================================================================
// 🟢 ENGINE 1: MOVIES4U SCRAPER (Universal Parser)
// =====================================================================
async function scrapeMovies4u(targetUrl: string) {
    const res = await fetch(targetUrl, { headers: HEADERS });
    if (!res.ok) throw new Error(`Failed to fetch ${targetUrl}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // 1. Metadata
    let rawTitle = $('meta[property="og:title"]').attr('content') || $('title').text();
    let title = rawTitle
        .replace(/^Download\s+/i, '')
        .replace(/\s*\[.*?\]/g, '')
        .replace(/\s*\(.*?\)/g, '')
        .split('–')[0]
        .trim();

    const poster = $('meta[property="og:image"]').attr('content') || $('.entry-content img').first().attr('src');
    
    let plot = $('meta[property="og:description"]').attr('content');
    if (!plot || plot.length < 50) {
        plot = $('.entry-content p').not(':has(a)').first().text().trim();
    }

    let imdbId = null;
    const imdbLink = $('a[href*="imdb.com/title/tt"]').attr('href');
    if (imdbLink) {
        const match = imdbLink.match(/tt\d+/);
        if (match) imdbId = match[0];
    }

    let year = null;
    const yearMatch = rawTitle.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) year = yearMatch[0];

    // 2. Screenshots (Works perfectly now)
    let screenshots: string[] = [];
    $('.ss-img img, .container.ss-img img, center img').each((_, el) => {
        const src = $(el).attr('src');
        if (src && !src.includes('download') && !src.includes('icon') && !src.includes('ads') && !src.includes('telegram')) {
            screenshots.push(src);
        }
    });
    screenshots = Array.from(new Set(screenshots)).slice(0, 10);

    // 3. DOWNLOAD SECTIONS (Universal Parser)
    const downloadSections: any[] = [];
    
    let currentQuality = 'Standard';
    let currentTitle = 'Download Links';
    let currentSeason: number | null = null;
    let tempLinks: any[] = [];

    // Global Season Check
    const titleSeasonMatch = rawTitle.match(/(?:Season|S)\s*0?(\d+)/i);
    if (titleSeasonMatch) currentSeason = parseInt(titleSeasonMatch[1]);

    // Iterate over ALL elements in content to find flow
    $('.entry-content').children().each((i, el) => {
        const text = $(el).text().trim();
        const tagName = el.tagName.toLowerCase();
        
        // Detect Header (h3, h4, h5, or p with strong/bold)
        // Checks for "Download", "480p", "720p", "Links"
        const isHeader = tagName.match(/^h[3-6]$/) || (tagName === 'p' && $(el).find('strong, b, span').length > 0 && text.length < 150);
        const hasKeywords = text.match(/Download|Links|480p|720p|1080p|2160p|Season/i);

        if (isHeader && hasKeywords) {
            // Save previous section if it has links
            if (tempLinks.length > 0) {
                downloadSections.push({
                    title: currentTitle,
                    quality: currentQuality,
                    season: currentSeason,
                    links: [...tempLinks]
                });
                tempLinks = [];
            }

            // Update Context for next links
            currentTitle = text.replace(/Download/i, '').trim() || "Download Links";
            
            // Detect Quality
            if (text.includes('480p')) currentQuality = '480p';
            else if (text.includes('720p')) currentQuality = '720p';
            else if (text.includes('1080p')) currentQuality = '1080p';
            else if (text.includes('4K') || text.includes('2160p')) currentQuality = '4K';
            
            // Detect Season in Header
            const sMatch = text.match(/(?:Season|S)\s*0?(\d+)/i);
            if (sMatch) currentSeason = parseInt(sMatch[1]);
        }

        // Find Links inside this element (p, div, ul, or even the header itself)
        $(el).find('a').each((_, linkEl) => {
            const href = $(linkEl).attr('href');
            let label = $(linkEl).text().trim();
            
            if (href && href.startsWith('http') && !href.includes('imdb.com') && !href.includes('youtube.com')) {
                // Filter Junk
                if (!label.toLowerCase().includes('telegram') && !label.toLowerCase().includes('whatsapp') && !href.includes('wp-admin')) {
                    
                    // Fallback Label
                    if (!label || label.toLowerCase() === 'download' || label.toLowerCase() === 'link' || label.toLowerCase() === 'click here') {
                        label = currentTitle;
                    }

                    tempLinks.push({
                        label: label,
                        url: href,
                        isZip: label.toLowerCase().includes('zip') || label.toLowerCase().includes('pack')
                    });
                }
            }
        });
    });

    // Save the last batch
    if (tempLinks.length > 0) {
        downloadSections.push({
            title: currentTitle,
            quality: currentQuality,
            season: currentSeason,
            links: tempLinks
        });
    }

    // Collect Seasons
    const allSeasons = new Set<number>();
    downloadSections.forEach(s => { if(s.season) allSeasons.add(s.season) });

    return NextResponse.json({
        title,
        year,
        poster,
        plot,
        imdbId,
        seasons: Array.from(allSeasons).sort((a,b) => a-b),
        screenshots,
        downloadSections
    });
}

// =====================================================================
// 🔵 ENGINE 2: MOVIESDRIVE UPGRADED SCRAPER (Unchanged)
// =====================================================================
async function scrapeMoviesDrive(targetUrl: string) {
    const res = await fetch(targetUrl, { headers: HEADERS });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 1. Basic Info
    const rawTitle = $('h1.page-title .material-text').text().trim();
    let title = rawTitle.replace(/^Download\s+/i, '').split(/[\(\[]/)[0].trim();
    
    const yearMatch = rawTitle.match(/\((\d{4})\)/);
    const year = yearMatch ? yearMatch[1] : null;

    const poster = $('.page-body img.aligncenter').attr('src') || '';
    const imdbId = extractImdbId(html);
    
    let plot = "Overview unavailable.";
    $('h3').each((i, el) => {
        if ($(el).text().includes('Storyline')) {
            const nextDiv = $(el).nextAll('div, p').first().text().trim();
            if (nextDiv) plot = nextDiv;
        }
    });

    const screenshots: string[] = [];
    $('center img, .page-body img').each((i, el) => {
        const src = $(el).attr('src');
        if (src && !src.includes('t.jpg') && src !== poster) {
            screenshots.push(src);
        }
    });

    // 2. Links Extraction
    let downloadSections = await scrapeMDriveLinks(targetUrl);

    // 3. SERIES DETECTION & MERGER LOGIC
    const isSeries = rawTitle.match(/(?:Season|S)\s*0?(\d+)/i);
    
    if (isSeries) {
        const seriesName = rawTitle.replace(/\s*(?:Season|S)\s*0?\d+.*/i, "").replace(/^Download\s+/i, "").trim();
        const otherSeasons = await findOtherSeasons(seriesName, targetUrl);

        if (otherSeasons.length > 0) {
            const promises = otherSeasons.map(os => scrapeMDriveLinks(os.url, os.season));
            const results = await Promise.all(promises);
            results.forEach(sections => {
                downloadSections = [...downloadSections, ...sections];
            });
        }
    }

    const allSeasons = new Set<number>();
    downloadSections.forEach((sec: any) => { if (sec.season) allSeasons.add(sec.season); });

    return NextResponse.json({
        title: title,
        year: year,
        poster: poster,
        plot: plot,
        imdbId: imdbId,
        seasons: Array.from(allSeasons).sort((a, b) => a - b),
        screenshots: screenshots.slice(0, 8),
        downloadSections: downloadSections
    });
}

// =====================================================================
// 🟠 ENGINE 3: OFFICIAL NETVLYX API (Fallback)
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

    const cleanTitle = (rawText: string) => {
        if (!rawText) return "";
        let text = rawText.replace(/-/g, ' ');
        const splitRegex = /[\(\[\.]|Season|S\d+|Ep\d+|\b\d{4}\b/i;
        let cleanPart = text.split(splitRegex)[0];
        cleanPart = cleanPart.trim();
        return cleanPart.replace(/\b\w/g, (l) => l.toUpperCase());
    };

    let finalTitle = cleanTitle(data.title);
    let releaseYear = null;

    if (!finalTitle || finalTitle.length < 2 || finalTitle.toLowerCase().includes('unknown')) {
        try {
            const slug = new URL(targetUrl).pathname.split('/').filter(Boolean).pop() || "";
            const yearMatch = slug.match(/-(\d{4})-/);
            if (yearMatch) releaseYear = yearMatch[1];
            finalTitle = cleanTitle(slug);
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
// 🛠️ HELPERS
// =====================================================================

// Helper: Extract IMDb ID
const extractImdbId = (html: string): string | null => {
    const $ = cheerio.load(html);
    let imdbId = null;
    $('strong').each((i, el) => {
        const text = $(el).text();
        if (text.includes('iMDB Rating')) {
            const link = $(el).next('a').attr('href');
            if (link) {
                const match = link.match(/(tt\d+)/);
                if (match) imdbId = match[1];
            }
        }
    });
    return imdbId;
};

// Helper: MoviesDrive Link Scraper
async function scrapeMDriveLinks(url: string, forceSeason: number | null = null) {
    try {
        const res = await fetch(url, { headers: HEADERS });
        const html = await res.text();
        const $ = cheerio.load(html);
        const sections: any[] = [];
        const processedUrls = new Set();
        const rawTitle = $('h1.page-title').text().trim();
        let pageLevelSeason = null;
        const sMatch = rawTitle.match(/(?:Season|S)\s*0?(\d+)/i);
        if (sMatch) pageLevelSeason = parseInt(sMatch[1]);

        $('.page-body a').each((i, el) => {
            const link = $(el).attr('href');
            let text = $(el).text().trim();
            let contextText = text;
            const parentHeader = $(el).closest('h5, p, h3');
            const prevHeader = parentHeader.prev('h5, p, h3, h4');
            if (prevHeader.length) contextText += " " + prevHeader.text();

            if (link && (link.includes('mdrive') || link.includes('drive') || link.includes('archives')) && !processedUrls.has(link)) {
                let quality = "HD";
                if (contextText.match(/4k|2160p/i)) quality = '4K';
                else if (contextText.match(/1080p/i)) quality = '1080p';
                else if (contextText.match(/720p/i)) quality = '720p';
                else if (contextText.match(/480p/i)) quality = '480p';
                
                const sizeMatch = contextText.match(/\[(\d+(\.\d+)?\s?(MB|GB))\]/i);
                const size = sizeMatch ? sizeMatch[1] : "";
                
                let season = forceSeason; 
                if (season === null) {
                    let localMatch = contextText.match(/(?:Season|S)\s*0?(\d+)/i);
                    if (localMatch) season = parseInt(localMatch[1]);
                    else season = pageLevelSeason;
                }
                
                if (!processedUrls.has(link)) {
                    processedUrls.add(link);
                    sections.push({
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
        return sections;
    } catch (e) {
        return [];
    }
}

// Helper: Find Other Seasons
async function findOtherSeasons(seriesTitle: string, currentUrl: string) {
    try {
        const searchUrl = `https://moviesdrive.forum/?s=${encodeURIComponent(seriesTitle)}`;
        const res = await fetch(searchUrl, { headers: HEADERS });
        const html = await res.text();
        const $ = cheerio.load(html);
        const seasonPages: { season: number, url: string }[] = [];
        $('ul.recent-movies li.thumb').each((i, el) => {
            const title = $(el).find('figcaption p').text().trim();
            const link = $(el).find('figure a').attr('href');
            if (title.toLowerCase().includes(seriesTitle.toLowerCase()) && link && link !== currentUrl) {
                const match = title.match(/(?:Season|S)\s*0?(\d+)/i);
                if (match) seasonPages.push({ season: parseInt(match[1]), url: link });
            }
        });
        return seasonPages;
    } catch (e) { return []; }
}
