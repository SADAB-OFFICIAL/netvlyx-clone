// app/api/home/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET() {
  try {
    // 1. Target the Real Website
    const BASE_URL = 'https://movies4u.fans'; 
    
    // Fetch HTML
    const response = await fetch(BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 1800 } // Cache for 30 Minutes
    });

    if (!response.ok) throw new Error(`Failed to fetch ${BASE_URL}`);
    const html = await response.text();
    const $ = cheerio.load(html);

    const homeData: any = {
      featured: [], // For Hero Slider
      sections: []  // For Content Rows
    };

    // --- 2. SCRAPE HERO SLIDER (Featured Content) ---
    // Movies4u themes usually use classes like 'deslide-item' or 'big-slider-item'
    // Hum generic selectors use karenge jo mostly kaam karte hain
    $('.deslide-item, .item.big').each((i, el) => {
        if (i > 4) return; // Top 5 items only

        const title = $(el).find('.deslide-title, .title').text().trim();
        const desc = $(el).find('.deslide-desc, .desc').text().trim();
        const link = $(el).find('a').attr('href');
        const poster = $(el).find('img').attr('src');
        const rating = $(el).find('.deslide-imdb, .rating').text().trim() || "8.5";
        const quality = $(el).find('.deslide-quality, .quality').text().trim() || "HD";
        
        // Ensure valid data
        if (title && link) {
            homeData.featured.push({
                title,
                desc,
                link,
                poster, // Use this for background too
                backdrop: poster,
                rating,
                tags: [quality, 'Trending']
            });
        }
    });

    // --- 3. SCRAPE SECTIONS (Latest Movies, Series, etc.) ---
    
    // Helper function to scrape a specific section by ID or Class
    const scrapeSection = (selector: string, sectionTitle: string) => {
        const items: any[] = [];
        
        $(selector).find('article, .item').each((i, el) => {
            if (i > 11) return; // Limit 12 items per row

            const title = $(el).find('.entry-title, .title').text().trim();
            const link = $(el).find('a').attr('href');
            // Lazy loaded images often use data-src
            const poster = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
            const rating = $(el).find('.vote, .rating').text().trim() || null;
            const quality = $(el).find('.quality').text().trim() || "HD";

            if (title && link && poster) {
                items.push({ title, link, poster, rating, quality });
            }
        });

        if (items.length > 0) {
            homeData.sections.push({ title: sectionTitle, items });
        }
    };

    // Scrape Standard Sections (IDs based on standard themes)
    scrapeSection('#latest-movies', 'Latest Movies');
    scrapeSection('#latest-tv-shows', 'Web Series');
    scrapeSection('#featured-titles', 'Featured');
    scrapeSection('.latest-updates', 'Recently Added');

    return NextResponse.json({ success: true, data: homeData });

  } catch (error: any) {
    console.error("Scraper Error:", error.message);
    return NextResponse.json({ success: false, error: 'Failed to load home data' });
  }
}
