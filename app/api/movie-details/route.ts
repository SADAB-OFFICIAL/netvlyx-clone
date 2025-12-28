// app/api/movie-details/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // 1. ADDED PROXY HEADERS (Bypass Protection)
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Referer": "https://movies4u.fans/", // Fake referer
        "Origin": "https://movies4u.fans"
      }
    });
    
    if (!response.ok) throw new Error("Source Blocked");

    const html = await response.text();
    const $ = cheerio.load(html);

    // --- Basic Info ---
    const title = $('h1.entry-title, .title').first().text().trim();
    
    // Poster: Try multiple sources
    let poster = $('.post-thumbnail img').attr('src') || 
                 $('.entry-content img').first().attr('src') || 
                 $('meta[property="og:image"]').attr('content');

    // Plot
    let plot = '';
    $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 50 && !text.includes('Download') && !text.includes('Join') && !plot) {
            plot = text;
        }
    });

    // --- SCREENSHOTS (Strict Filter) ---
    const screenshots: string[] = [];
    const contentArea = $('.entry-content, .thecontent, .post-content');
    
    contentArea.find('img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src !== poster) {
            if (!src.includes('icon') && !src.includes('logo') && !src.includes('button') && !src.includes('whatsapp')) {
                screenshots.push(src);
            }
        }
    });
    // Limit to 8 unique images
    const uniqueScreenshots = [...new Set(screenshots)].slice(0, 8);

    // --- DOWNLOAD LINKS (Headings Based - Fixes Seasons) ---
    const downloadSections: any[] = [];
    
    // Scan headers to separate Seasons (Season 1, Season 2...)
    $('h3, h4, h5, h6, strong, b').each((i, el) => {
        const headingText = $(el).text().trim();
        
        // Valid section must have these keywords
        const isRelevant = /480p|720p|1080p|2160p|4k|Season|Episode|Download|Zip|Pack/i.test(headingText);

        if (isRelevant) {
            const links: any[] = [];
            
            // Collect links under this heading
            $(el).nextUntil('h3, h4, h5, h6').find('a').each((j, linkEl) => {
                const linkUrl = $(linkEl).attr('href');
                const linkText = $(linkEl).text().trim();
                
                // Filter Cloud Links
                if (linkUrl && (linkUrl.includes('drive') || linkUrl.includes('hub') || linkUrl.includes('cloud') || linkUrl.includes('gdflix') || linkUrl.includes('file'))) {
                    links.push({ label: linkText || 'Download', url: linkUrl });
                }
            });

            // Some themes put links directly as siblings
            if (links.length === 0) {
                 $(el).nextUntil('h3, h4, h5, h6').filter('a').each((j, linkEl) => {
                    const linkUrl = $(linkEl).attr('href');
                    const linkText = $(linkEl).text().trim();
                    if (linkUrl && (linkUrl.includes('drive') || linkUrl.includes('hub'))) {
                        links.push({ label: linkText || 'Download', url: linkUrl });
                    }
                 });
            }

            if (links.length > 0) {
                downloadSections.push({ title: headingText, links });
            }
        }
    });

    return NextResponse.json({
        title,
        poster,
        plot,
        screenshots: uniqueScreenshots,
        downloadSections
    });

  } catch (error) {
    console.error("Scraper Error:", error);
    return NextResponse.json({ error: 'Failed to fetch details' });
  }
}
