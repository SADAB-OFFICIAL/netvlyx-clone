// app/api/movie-details/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error("Failed to fetch movie page");

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Basic Info Extract karein
    const title = $('h1.entry-title, h1.title').text().trim();
    const poster = $('.entry-content img, .post-thumbnail img').first().attr('src') || 
                   $('.entry-content img').first().attr('data-src');
    
    // Plot nikalna (Paragraphs ko jodkar)
    let plot = '';
    $('.entry-content p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 50 && !text.includes('Download') && !text.includes('Join')) {
        plot += text + ' ';
      }
    });

    // 2. Download Links Extract karein (Real Logic)
    // Movies4u aksar links ko "Download 720p" headers ke niche rakhta hai
    const downloadSections: any[] = [];
    
    // Pattern 1: Headers ke baad links dhundna (Common in Movies4u)
    $('h3, h4, h5').each((i, el) => {
      const headerText = $(el).text().toLowerCase();
      
      // Agar header mein quality likhi hai (e.g. 720p, 1080p, 480p)
      if (headerText.includes('480p') || headerText.includes('720p') || headerText.includes('1080p') || headerText.includes('download')) {
        const links: any[] = [];
        
        // Header ke baad wale elements mein links dhundo
        let nextElem = $(el).next();
        let limit = 0;
        
        // 5 elements tak niche check karo jab tak agla header na aaye
        while (nextElem.length > 0 && limit < 8 && !nextElem.is('h3, h4, h5')) {
          nextElem.find('a').each((j, linkEl) => {
            const linkUrl = $(linkEl).attr('href');
            const linkText = $(linkEl).text().trim() || "Download Link";
            
            // Bekar links filter karein
            if (linkUrl && !linkUrl.includes('telegram') && !linkUrl.includes('whatsapp')) {
              links.push({ label: linkText, url: linkUrl });
            }
          });
          nextElem = nextElem.next();
          limit++;
        }

        if (links.length > 0) {
          downloadSections.push({
            title: $(el).text().trim(), // e.g., "Download 720p Links"
            links: links
          });
        }
      }
    });

    // Fallback: Agar upar wala method fail ho jaye, to saare buttons utha lo
    if (downloadSections.length === 0) {
      const links: any[] = [];
      $('.entry-content a.button, .entry-content a.btn').each((i, el) => {
        links.push({ label: $(el).text().trim(), url: $(el).attr('href') });
      });
      if (links.length > 0) downloadSections.push({ title: "Download Links", links });
    }

    return NextResponse.json({
      title: title || "Unknown Title",
      poster: poster || "",
      plot: plot.substring(0, 300) + "..." || "No details available.",
      downloadSections
    });

  } catch (error) {
    console.error("Scraping Details Error:", error);
    return NextResponse.json({ error: 'Failed to scrape details' }, { status: 500 });
  }
}
