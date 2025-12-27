// app/api/scrape/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'home';
  const page = searchParams.get('page') || '1';
  const search = searchParams.get('s');

  // Target URL logic (Example: Movies4u)
  let targetUrl = 'https://movies4u.rip'; // Note: Domain change hote rehte hain
  
  if (search) {
    targetUrl += `/?s=${encodeURIComponent(search)}`;
  } else if (category === 'home') {
    targetUrl += `/page/${page}`;
  } else {
    targetUrl += `/category/${category}/page/${page}`;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const movies: any[] = [];

    // Selector logic (Movies4u structure ke hisab se adjust karein)
    $('article, .post-item').each((i, el) => {
      const title = $(el).find('h2, .entry-title').text().trim();
      const link = $(el).find('a').attr('href');
      const poster = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      
      if (title && link) {
        movies.push({ title, link, poster });
      }
    });

    return NextResponse.json({ movies });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to scrape', movies: [] }, { status: 500 });
  }
}
