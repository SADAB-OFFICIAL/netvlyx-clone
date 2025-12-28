// app/api/movie-details/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);

    // Basic Info
    const title = $('h1.entry-title').text().trim() || $('.title').text().trim();
    const poster = $('.post-thumbnail img').attr('src') || $('.entry-content img').first().attr('src');
    
    let plot = '';
    $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 60 && !text.includes('Download') && !text.includes('Telegram')) {
            plot = text;
            return false;
        }
    });

    // --- STRICT SCREENSHOT SCRAPER ---
    const screenshots: string[] = [];
    const contentArea = $('.entry-content, .thecontent, .post-content');
    
    contentArea.find('img').each((i, el) => {
        const src = $(el).attr('data-src') || $(el).attr('src');
        if (src) {
            const isPoster = src === poster;
            const isJunk = src.includes('icon') || src.includes('button') || src.includes('logo') || src.includes('whatsapp') || src.includes('telegram');
            if (!isPoster && !isJunk) screenshots.push(src);
        }
    });

    const finalScreenshots = screenshots.slice(0, 6);

    // --- DOWNLOAD LINKS ---
    const downloadSections: any[] = [];
    $('h3, h4, h5').each((i, el) => {
        const heading = $(el).text().trim();
        if (heading.match(/480p|720p|1080p|Download/i)) {
            const links: any[] = [];
            $(el).nextUntil('h3, h4, h5').find('a').each((j, linkEl) => {
                const linkUrl = $(linkEl).attr('href');
                const linkText = $(linkEl).text().trim();
                if (linkUrl && (linkUrl.includes('hubcloud') || linkUrl.includes('drive') || linkUrl.includes('gdflix'))) {
                    links.push({ label: linkText || 'Download', url: linkUrl });
                }
            });
            if (links.length > 0) downloadSections.push({ title: heading, links });
        }
    });

    return NextResponse.json({
        title, poster, plot,
        screenshots: finalScreenshots,
        downloadSections
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch details' });
  }
}
