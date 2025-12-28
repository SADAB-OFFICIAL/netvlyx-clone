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
    // Poster: Try multiple selectors
    let poster = $('.post-thumbnail img').attr('src') || 
                 $('.entry-content img').first().attr('src') ||
                 $('meta[property="og:image"]').attr('content');

    let plot = '';
    $('p').each((i, el) => {
        const text = $(el).text().trim();
        // Plot usually fits these criteria
        if (text.length > 60 && !text.includes('Download') && !text.includes('Join') && !plot) {
            plot = text;
        }
    });

    // --- 2. ROBUST SCREENSHOTS (Fixed) ---
    const screenshots: string[] = [];
    const contentArea = $('.entry-content, .thecontent, .post-content');
    
    contentArea.find('img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src !== poster) {
            // Simple filter: Must be a decent length URL and not an obvious icon
            if (!src.includes('icon') && !src.includes('logo') && !src.includes('button')) {
                screenshots.push(src);
            }
        }
    });
    // Agar scrape se nahi mile, to fallback mat lagao (User request) - just distinct ones
    const uniqueScreenshots = [...new Set(screenshots)].slice(0, 8);


    // --- 3. UNIVERSAL LINK FINDER (The Magic Fix) ---
    // Instead of relying on headings, we scan ALL links and categorize them
    const tempGroups: Record<string, any[]> = {
        '480p': [],
        '720p': [],
        '1080p': [],
        '2160p': [],
        'Standard': []
    };

    $('a').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        const parentText = $(el).parent().text().trim(); // Context from paragraph

        // Filter for Drive/Hub/Cloud links
        if (href && (href.includes('drive') || href.includes('hub') || href.includes('cloud') || href.includes('gdflix'))) {
            
            // Detect Quality from Link Text or Parent Text
            const combinedText = (text + " " + parentText).toLowerCase();
            
            let quality = 'Standard';
            if (combinedText.includes('4k') || combinedText.includes('2160p')) quality = '2160p';
            else if (combinedText.includes('1080p')) quality = '1080p';
            else if (combinedText.includes('720p')) quality = '720p';
            else if (combinedText.includes('480p')) quality = '480p';

            tempGroups[quality].push({ 
                label: text || 'Download Link', 
                url: href 
            });
        }
    });

    // Convert groups to array format
    const downloadSections: any[] = [];
    Object.keys(tempGroups).forEach(quality => {
        if (tempGroups[quality].length > 0) {
            downloadSections.push({
                title: quality === 'Standard' ? 'Download Links' : `${quality} Links`,
                links: tempGroups[quality]
            });
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
