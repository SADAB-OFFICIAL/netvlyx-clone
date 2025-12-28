// app/api/movie-details/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);

    // --- 1. Basic Details ---
    const title = $('h1.entry-title, .title').first().text().trim();
    // Try multiple sources for poster
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

    // --- 2. SCREENSHOTS (Strict Filter) ---
    const screenshots: string[] = [];
    const contentArea = $('.entry-content, .thecontent, .post-content');
    
    contentArea.find('img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src !== poster) {
            // Filter out icons, buttons, and logos
            if (!src.includes('icon') && !src.includes('logo') && !src.includes('button') && !src.includes('whatsapp') && !src.includes('telegram')) {
                screenshots.push(src);
            }
        }
    });
    const uniqueScreenshots = [...new Set(screenshots)].slice(0, 8);

    // --- 3. DOWNLOAD LINKS (Structure Based - Fixes Season Filter) ---
    const downloadSections: any[] = [];
    
    // Look for headings that define sections (Standard Movies4u structure)
    $('h3, h4, h5, h6, strong, b').each((i, el) => {
        const headingText = $(el).text().trim();
        
        // Valid headings must contain keywords
        const isRelevant = /480p|720p|1080p|2160p|4k|Season|Episode|Download|Zip|Pack/i.test(headingText);

        if (isRelevant) {
            const links: any[] = [];
            
            // Find links until the next heading
            $(el).nextUntil('h3, h4, h5, h6').find('a').each((j, linkEl) => {
                const linkUrl = $(linkEl).attr('href');
                const linkText = $(linkEl).text().trim();
                
                // Filter drive/cloud links
                if (linkUrl && (linkUrl.includes('drive') || linkUrl.includes('hub') || linkUrl.includes('cloud') || linkUrl.includes('gdflix') || linkUrl.includes('file'))) {
                    links.push({ label: linkText || 'Download', url: linkUrl });
                }
            });

            // Also check immediate siblings (sometimes links are direct siblings)
            if (links.length === 0) {
                 $(el).nextUntil('h3, h4, h5, h6').filter('a').each((j, linkEl) => {
                    const linkUrl = $(linkEl).attr('href');
                    const linkText = $(linkEl).text().trim();
                    if (linkUrl && (linkUrl.includes('drive') || linkUrl.includes('hub') || linkUrl.includes('cloud'))) {
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
    return NextResponse.json({ error: 'Failed to fetch details' });
  }
}
