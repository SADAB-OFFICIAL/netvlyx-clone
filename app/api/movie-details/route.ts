// app/api/movie-details/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // 1. USE VLYX PROXY (Bypass Protection)
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
                 $('.entry-content img').first().attr('src') ||
                 $('meta[property="og:image"]').attr('content');
    
    let plot = '';
    $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 50 && !text.includes('Download') && !text.includes('Join') && !plot) {
            plot = text;
        }
    });

    // --- 3. DETECT TYPE (Movie/Series) & SEASONS ---
    const titleSeasonMatch = title.match(/(?:Season|S)\s*(\d+)/i);
    const rangeMatch = title.match(/(?:Season|S)\s*(\d+)\s*[-–—]\s*(\d+)/i);
    
    let isSeries = !!titleSeasonMatch || !!rangeMatch;
    let detectedSeasons = new Set<number>();

    // --- 4. SCREENSHOTS ---
    const screenshots: string[] = [];
    $('.entry-content img, .post-content img, .ss-img img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src !== poster && !src.includes('icon') && !src.includes('button') && !src.includes('logo')) {
            screenshots.push(src);
        }
    });
    const uniqueScreenshots = [...new Set(screenshots)].slice(0, 8);

    // --- 5. DEEP LINK EXTRACTION ---
    const downloadSections: any[] = [];
    
    // Helper: Valid link checker
    const isValidLink = (href: string) => 
        href && (href.includes('drive') || href.includes('hub') || href.includes('cloud') || href.includes('gdflix') || href.includes('file') || href.includes('pixel'));

    // Scan headers to identify sections
    $('h3, h4, h5, h6, strong, b').each((i, el) => {
        const headingText = $(el).text().trim();
        const lowerHeading = headingText.toLowerCase();

        // Valid section keywords
        if (lowerHeading.match(/480p|720p|1080p|2160p|4k|season|episode|download|zip|pack/)) {
            
            // A. Detect Season
            let sectionSeason: number | null = null;
            const sMatch = headingText.match(/(?:Season|S)\s*0?(\d+)/i);
            if (sMatch) {
                sectionSeason = parseInt(sMatch[1]);
                detectedSeasons.add(sectionSeason);
                isSeries = true; // Section confirms series
            }

            // B. Detect Quality
            let quality = 'Standard';
            if (lowerHeading.includes('4k') || lowerHeading.includes('2160p')) quality = '4K';
            else if (lowerHeading.includes('1080p')) quality = '1080p';
            else if (lowerHeading.includes('720p')) quality = '720p';
            else if (lowerHeading.includes('480p')) quality = '480p';

            // C. Find Links (Deep Search)
            const links: any[] = [];
            
            // Get all siblings until next header
            const siblings = $(el).nextUntil('h3, h4, h5, h6');
            
            siblings.each((j, sib) => {
                // 1. Check if the sibling itself is a link
                if ($(sib).is('a')) {
                    const href = $(sib).attr('href');
                    const text = $(sib).text().trim();
                    if (isValidLink(href || '')) links.push({ label: text || 'Download', url: href });
                }
                
                // 2. Search inside the sibling (e.g. paragraph or div)
                $(sib).find('a').each((k, childLink) => {
                    const href = $(childLink).attr('href');
                    const text = $(childLink).text().trim();
                    if (isValidLink(href || '')) links.push({ label: text || 'Download', url: href });
                });
            });

            if (links.length > 0) {
                downloadSections.push({
                    title: headingText,
                    season: sectionSeason, 
                    quality: quality,
                    links: links
                });
            }
        }
    });

    // Fallback: If no sections found, scan whole content area
    if (downloadSections.length === 0) {
        const allLinks: any[] = [];
        $('.entry-content a, .post-content a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            if (isValidLink(href || '')) {
                allLinks.push({ label: text || 'Download Link', url: href });
            }
        });
        if (allLinks.length > 0) {
            downloadSections.push({ 
                title: 'Download Links', 
                season: null, 
                quality: 'Standard', 
                links: allLinks 
            });
        }
    }

    // Handle Title Ranges (e.g. Season 1-5)
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
