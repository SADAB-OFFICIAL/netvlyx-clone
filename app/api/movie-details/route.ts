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
    const title = $('h1.entry-title').text().trim() || $('.title').text().trim();
    // Poster: Try finding main poster
    let poster = $('.post-thumbnail img').attr('src') || 
                 $('.entry-content img').first().attr('src');

    // Plot Extraction
    let plot = '';
    $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 50 && !text.includes('Download') && !text.includes('Join') && !plot) {
            plot = text;
        }
    });

    // --- 2. SCREENSHOTS (Restored) ---
    // Content area se images uthayenge
    const screenshots: string[] = [];
    const contentArea = $('.entry-content, .thecontent, .post-content');
    
    contentArea.find('img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src !== poster) {
            // Basic filtering to remove icons/buttons
            if (!src.includes('icon') && !src.includes('logo') && !src.includes('button') && !src.includes('whatsapp')) {
                screenshots.push(src);
            }
        }
    });
    // Remove duplicates & limit
    const uniqueScreenshots = [...new Set(screenshots)].slice(0, 8);


    // --- 3. DOWNLOAD LINKS (The "Before" Logic - Heading Based) ---
    const downloadSections: any[] = [];
    
    // Movies4u structure usually uses H3, H4, H5, or Strong tags for sections
    $('h3, h4, h5, h6, .wp-block-heading').each((i, el) => {
        const headingText = $(el).text().trim();
        
        // Filter valid headings (Must contain Quality or Season or Download keyword)
        const isRelevant = /480p|720p|1080p|2160p|4k|Season|Episode|Download/i.test(headingText);

        if (isRelevant) {
            const links: any[] = [];
            
            // Find all links between this heading and the next heading
            $(el).nextUntil('h3, h4, h5, h6, .wp-block-heading').find('a').each((j, linkEl) => {
                const linkUrl = $(linkEl).attr('href');
                const linkText = $(linkEl).text().trim();
                
                // Validate Drive/Cloud links
                if (linkUrl && (linkUrl.includes('drive') || linkUrl.includes('hub') || linkUrl.includes('cloud') || linkUrl.includes('gdflix'))) {
                    links.push({ label: linkText || 'Download', url: linkUrl });
                }
            });

            if (links.length > 0) {
                downloadSections.push({ title: headingText, links });
            }
        }
    });

    // Fallback: If no sections found (rare case), scan all links
    if (downloadSections.length === 0) {
        const allLinks: any[] = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && (href.includes('drive') || href.includes('hub'))) {
                allLinks.push({ label: $(el).text().trim() || 'Download', url: href });
            }
        });
        if (allLinks.length > 0) downloadSections.push({ title: 'Download Links', links: allLinks });
    }

    return NextResponse.json({
        title,
        poster,
        plot,
        screenshots: uniqueScreenshots,
        downloadSections
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' });
  }
}
