// app/api/movie-details/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('h1.entry-title, h1.title').text().trim();
    const poster = $('.post-thumbnail img').first().attr('src') || $('.entry-content img').first().attr('src');

    // 1. Screenshots Logic (Fixed)
    const screenshots: string[] = [];
    // Movies4u usually puts screenshots in a div with class 'ss-img' or centered paragraphs
    $('.ss-img img, .entry-content p img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      // Poster ko dubara screenshots mein na lein
      if (src && src !== poster && screenshots.length < 10) {
        screenshots.push(src);
      }
    });

    let plot = '';
    $('.entry-content p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 50 && !text.includes('Download') && !text.includes('Join')) plot += text + ' ';
    });

    const downloadSections: any[] = [];
    $('h3, h4, h5').each((i, el) => {
      const text = $(el).text().toLowerCase();
      if (text.includes('480p') || text.includes('720p') || text.includes('1080p') || text.includes('download')) {
        const links: any[] = [];
        let next = $(el).next();
        let count = 0;
        while (next.length > 0 && count < 5 && !next.is('h3, h4, h5')) {
          next.find('a').each((j, link) => {
            const href = $(link).attr('href');
            const label = $(link).text().trim() || "Download Link";
            if (href && !href.includes('telegram')) links.push({ label, url: href });
          });
          next = next.next();
          count++;
        }
        if (links.length > 0) downloadSections.push({ title: $(el).text().trim(), links });
      }
    });

    return NextResponse.json({ 
      title, 
      poster, 
      plot, 
      screenshots, // Ye naya data hai
      downloadSections 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Scraping Failed' }, { status: 500 });
  }
}
