import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // 1. USE PROXY
    const proxyUrl = `https://proxy.vlyx.workers.dev/?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error("Proxy Failed");
    const html = await response.text();
    const $ = cheerio.load(html);

    // --- 2. BASIC DETAILS & SMART TITLE ---
    let title = $('h1.entry-title, .title').first().text().trim();
    
    // SMART TITLE FALLBACK: Agar title nahi mila ya "Unknown" hai, to URL se nikalo
    if (!title || title.toLowerCase().includes('unknown')) {
        try {
            const slug = new URL(url).pathname.split('/').filter(Boolean).pop() || "";
            title = slug
                .replace(/-/g, ' ') // Hyphens ko space banao
                .replace(/\b(download|free|movie|hindi|dubbed|dual|audio|season|episode|s\d+|e\d+|480p|720p|1080p|2160p|4k|web-dl|bluray|hdrip|multi|org)\b/gi, '') // Faltu words hatao
                .replace(/\s+/g, ' ') // Extra spaces hatao
                .trim();
            // Har word ka pehla letter capital karo
            title = title.replace(/\b\w/g, (l: string) => l.toUpperCase());
        } catch (e) {
            title = "Unknown Movie";
        }
    }

    const poster = $('.post-thumbnail img').attr('src') || $('.entry-content img').first().attr('src');
    
    // Fallback Plot (Movies4u wala)
    let plotArr: string[] = [];
    $('.entry-content p, .post-content p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 40 && !text.toLowerCase().includes('download') && !text.toLowerCase().includes('telegram')) {
            plotArr.push(text);
        }
    });
    const scrapedPlot = plotArr.slice(0, 2).join('\n\n') || "Loading overview...";

    // --- 3. EXTRACTION: IMDb ID ---
    let imdbId = null;
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('imdb.com/title/tt')) {
            const match = href.match(/tt\d+/);
            if (match) {
                imdbId = match[0];
                return false; // Break loop
            }
        }
    });

    // --- 4. SCREENSHOTS (FROM SOURCE WEBSITE) ---
    const screenshots: string[] = [];
    // Priority 1: Specific screenshot class
    $('.ss-img img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src) screenshots.push(src);
    });
    // Priority 2: Content images (agar .ss-img na mile)
    if (screenshots.length === 0) {
        $('.entry-content img').each((i, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src');
            // Poster aur icons ko filter karo
            if (src && src !== poster && !src.includes('icon') && !src.includes('button')) {
                screenshots.push(src);
            }
        });
    }

    // --- 5. LINKS & SEASONS ---
    const downloadSections: any[] = [];
    let detectedSeasons = new Set<number>();

    const isValidLink = (href: string) => 
        href && (href.includes('drive') || href.includes('hub') || href.includes('cloud') || href.includes('gdflix') || href.includes('file') || href.includes('workers.dev'));

    $('h3, h4, h5, h6, strong, b').each((i, el) => {
        const headingText = $(el).text().trim();
        const lowerHeading = headingText.toLowerCase();

        if (lowerHeading.match(/480p|720p|1080p|2160p|4k|season|episode|download|zip|pack/)) {
            let sectionSeason: number | null = null;
            const sMatch = headingText.match(/(?:Season|S)\s*0?(\d+)/i);
            if (sMatch) {
                sectionSeason = parseInt(sMatch[1]);
                detectedSeasons.add(sectionSeason);
            }

            let quality = 'Standard';
            if (lowerHeading.includes('4k') || lowerHeading.includes('2160p')) quality = '4K';
            else if (lowerHeading.includes('1080p')) quality = '1080p';
            else if (lowerHeading.includes('720p')) quality = '720p';
            else if (lowerHeading.includes('480p')) quality = '480p';

            const links: any[] = [];
            // Logic to find links under the heading
            $(el).nextUntil('h3, h4, h5, h6').each((j, sib) => {
                const processLink = (l: any) => {
                    const href = $(l).attr('href');
                    if (isValidLink(href || '')) links.push({ label: $(l).text().trim(), url: href });
                };
                if ($(sib).is('a')) processLink(sib);
                $(sib).find('a').each((k, child) => processLink(child));
            });

            if (links.length > 0) {
                downloadSections.push({ title: headingText, season: sectionSeason, quality, links });
            }
        }
    });

    // Detect Season Range from Title if no specific season headings found
    if (detectedSeasons.size === 0) {
        const range = title.match(/(?:Season|S)\s*(\d+)\s*[-–—]\s*(\d+)/i);
        if (range) {
            for (let i = parseInt(range[1]); i <= parseInt(range[2]); i++) detectedSeasons.add(i);
        }
    }

    return NextResponse.json({
        title, // Ab ye smart title hoga
        poster,
        plot: scrapedPlot,
        imdbId: imdbId,
        seasons: Array.from(detectedSeasons).sort((a,b)=>a-b),
        screenshots: [...new Set(screenshots)].slice(0, 8), // Unique and limited to 8
        downloadSections
    });

  } catch (error) {
    console.error("Scraper Error:", error);
    return NextResponse.json({ error: 'Failed' });
  }
}
