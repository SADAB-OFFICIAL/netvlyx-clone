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

    // 1. Basic Info
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

    // 2. SCREENSHOTS
    const screenshots: string[] = [];
    $('.entry-content img, .post-content img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src !== poster && !src.includes('icon') && !src.includes('button') && !src.includes('logo')) {
            screenshots.push(src);
        }
    });
    const uniqueScreenshots = [...new Set(screenshots)].slice(0, 8);

    // 3. DOWNLOAD LINKS (The Fix: Heading Based Logic)
    const downloadSections: any[] = [];
    
    // Scan standard headings used by Movies4u/Vega
    $('h3, h4, h5, h6, strong, p > strong').each((i, el) => {
        const headingText = $(el).text().trim();
        
        // Agar Heading me "Season", "480p", "Download" jaisa kuch hai
        if (/Season|Episode|480p|720p|1080p|2160p|4k|Download|Zip|Pack/i.test(headingText)) {
            
            const links: any[] = [];
            
            // Us heading ke neeche ke links dhundo jab tak agli heading na aaye
            $(el).nextUntil('h3, h4, h5, h6').find('a').each((j, linkEl) => {
                const href = $(linkEl).attr('href');
                const text = $(linkEl).text().trim();
                
                if (href && (href.includes('drive') || href.includes('hub') || href.includes('cloud') || href.includes('gdflix'))) {
                    links.push({ label: text || 'Download Link', url: href });
                }
            });

            // Agar links mile, to section bana do
            if (links.length > 0) {
                downloadSections.push({ title: headingText, links });
            }
        }
    });

    // Fallback: Agar upar wala fail ho jaye (rare movie pages)
    if (downloadSections.length === 0) {
        const allLinks: any[] = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && (href.includes('drive') || href.includes('hub'))) {
                allLinks.push({ label: $(el).text().trim() || 'Download', url: href });
            }
        });
        if (allLinks.length > 0) {
            downloadSections.push({ title: 'Download Links', links: allLinks });
        }
    }

    return NextResponse.json({
        title, poster, plot,
        screenshots: uniqueScreenshots,
        downloadSections
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed' });
  }
}
