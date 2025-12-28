// app/api/home/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET() {
  try {
    // 1. Target Real Site
    const BASE_URL = 'https://movies4u.fans'; 
    const response = await fetch(BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) throw new Error("Failed to fetch source");
    const html = await response.text();
    const $ = cheerio.load(html);

    const homeData: any = {
      featured: null,
      sections: []
    };

    // --- 2. SCRAPE HERO SECTION (Featured) ---
    // Movies4u par aksar bada slider hota hai
    const heroEl = $('.deslide-item').first(); 
    if (heroEl.length > 0) {
        const title = heroEl.find('.deslide-title').text().trim();
        const desc = heroEl.find('.deslide-desc').text().trim();
        const poster = heroEl.find('img').attr('src');
        const link = heroEl.find('a').attr('href');
        const rating = heroEl.find('.deslide-imdb').text().trim();
        const backdrop = heroEl.find('.deslide-cover img').attr('src') || poster;

        homeData.featured = {
            title,
            desc,
            poster,
            backdrop,
            rating,
            link,
            tags: ['Trending', 'Latest']
        };
    }

    // --- 3. SCRAPE SECTIONS (Latest Movies, Series) ---
    // Hum sections ko loop karenge
    
    const scrapeSection = (selector: string, title: string) => {
        const items: any[] = [];
        $(selector).find('article').each((i, el) => {
            if (i > 9) return; // Limit to 10 items
            const title = $(el).find('.item-title').text().trim();
            const poster = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
            const link = $(el).find('a').attr('href');
            const rating = $(el).find('.item-rating').text().trim();
            
            if (title && link) {
                items.push({ title, poster, link, rating });
            }
        });
        return { title, items };
    };

    // Movies4u specific selectors (Adjust based on actual site structure)
    homeData.sections.push(scrapeSection('#latest-movies', 'Latest Movies'));
    homeData.sections.push(scrapeSection('#latest-tv-shows', 'Web Series'));
    homeData.sections.push(scrapeSection('#featured-titles', 'Featured'));

    return NextResponse.json({ success: true, data: homeData });

  } catch (error: any) {
    console.error("Home Scrape Error:", error.message);
    return NextResponse.json({ success: false, error: 'Failed to load home data' });
  }
}
