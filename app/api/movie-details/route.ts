// app/api/movie-details/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // 1. USE VLYX PROXY (As requested)
    // This bypasses Cloudflare/Geo-blocking effectively
    const proxyUrl = `https://proxy.vlyx.workers.dev/?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) throw new Error("Proxy Failed");

    const html = await response.text();
    const $ = cheerio.load(html);

    // --- 2. BASIC DETAILS ---
    const title = $('h1.entry-title, .title').first().text().trim();
    let poster = $('.post-thumbnail img').attr('src') || 
                 $('.entry-content img').first().attr('src');
    
    let plot = '';
    $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 50 && !text.includes('Download') && !text.includes('Join') && !plot) {
            plot = text;
        }
    });

    // --- 3. DETECT TYPE & SEASONS ---
    // Check if title contains "Season" or structure implies series
    const titleSeasonMatch = title.match(/Season\s*(\d+)/i);
    const rangeMatch = title.match(/Season\s*(\d+)\s*[-–—]\s*(\d+)/i);
    
    let isSeries = !!titleSeasonMatch || !!rangeMatch;
    let detectedSeasons = new Set<number>();

    // --- 4. SCREENSHOTS ---
    const screenshots: string[] = [];
    $('.entry-content img, .post-content img, .ss-img img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src !== poster && !src.includes('icon') && !src.includes('button')) {
            screenshots.push(src);
        }
    });
    const uniqueScreenshots = [...new Set(screenshots)].slice(0, 8);

    // --- 5. SMART DOWNLOAD LINK PARSER ---
    const downloadSections: any[] = [];
    
    // Iterate over headings to find sections
    $('h3, h4, h5, h6, strong, b').each((i, el) => {
        const headingText = $(el).text().trim();
        const lowerHeading = headingText.toLowerCase();

        // Keywords to identify a download section
        if (lowerHeading.match(/480p|720p|1080p|2160p|4k|season|episode|download|zip|pack/)) {
            
            // A. Detect Season from Heading
            let sectionSeason: number | null = null;
            const sMatch = headingText.match(/(?:Season|S)\s*0?(\d+)/i);
            if (sMatch) {
                sectionSeason = parseInt(sMatch[1]);
                detectedSeasons.add(sectionSeason);
                isSeries = true;
            }

            // B. Detect Quality from Heading
            let quality = 'Standard';
            if (lowerHeading.includes('4k') || lowerHeading.includes('2160p')) quality = '4K';
            else if (lowerHeading.includes('1080p')) quality = '1080p';
            else if (lowerHeading.includes('720p')) quality = '720p';
            else if (lowerHeading.includes('480p')) quality = '480p';

            // C. Find Links
            const links: any[] = [];
            
            // Helper to check valid link
            const isValidLink = (href: string) => 
                href && (href.includes('drive') || href.includes('hub') || href.includes('cloud') || href.includes('gdflix') || href.includes('file'));

            // Look in next siblings until next header
            $(el).nextUntil('h3, h4, h5, h6').find('a').each((j, linkEl) => {
                const href = $(linkEl).attr('href');
                const text = $(linkEl).text().trim();
                if (isValidLink(href || '')) {
                    links.push({ label: text || 'Download Link', url: href });
                }
            });

            // Fallback for direct siblings
            if (links.length === 0) {
                 $(el).nextUntil('h3, h4, h5, h6').filter('a').each((j, linkEl) => {
                    const href = $(linkEl).attr('href');
                    if (isValidLink(href || '')) {
                        links.push({ label: $(linkEl).text().trim() || 'Download', url: href });
                    }
                 });
            }

            if (links.length > 0) {
                downloadSections.push({
                    title: headingText,
                    season: sectionSeason, // Backend ne identify kar liya
                    quality: quality,      // Backend ne identify kar liya
                    links: links
                });
            }
        }
    });

    // Handle Title Ranges (e.g. Season 1-5) if specific headers missing
    if (detectedSeasons.size === 0 && rangeMatch) {
        const start = parseInt(rangeMatch[1]);
        const end = parseInt(rangeMatch[2]);
        for (let i = start; i <= end; i++) detectedSeasons.add(i);
        isSeries = true;
    }

    return NextResponse.json({
        title,
        poster,
        plot,
        type: isSeries ? 'Series' : 'Movie',
        seasons: Array.from(detectedSeasons).sort((a,b) => a - b),
        screenshots: uniqueScreenshots,
        downloadSections
    });

  } catch (error: any) {
    console.error("Scraper Error:", error.message);
    return NextResponse.json({ error: 'Failed to fetch details' });
  }
}
