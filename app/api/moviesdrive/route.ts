import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET() {
  try {
    // 1. Fetch HTML (Proxy se ya Direct)
    // Real usage mein aap fetch('https://moviesdrive.forum') use karenge
    const targetUrl = 'https://moviesdrive.forum'; 
    const res = await fetch(targetUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        next: { revalidate: 1800 } // 30 Minutes Cache
    });
    
    const html = await res.text();
    const $ = cheerio.load(html);

    const items: any[] = [];

    // 2. Loop through each movie card
    $('ul.recent-movies li.thumb').each((i, el) => {
        // Elements select karna
        const titleEl = $(el).find('figcaption p');
        const imgEl = $(el).find('figure img');
        const linkEl = $(el).find('figure a');

        // Data extract karna
        const title = titleEl.text().trim();
        const image = imgEl.attr('src');
        const link = linkEl.attr('href');

        if (title && link) {
            // Category Logic (Title se guess karna)
            let category = "Bollywood"; // Default
            if (title.toLowerCase().includes('season')) category = "Web Series";
            else if (title.toLowerCase().includes('dual audio')) category = "Dual Audio";
            
            // Format for Sections
            items.push({
                title: title,
                image: image,
                link: link,
                description: title, // Home page pe desc nahi hai, title hi use karein
                category: category
            });
        }
    });

    // 3. Hero Section Data (Top 5 items for slider)
    // Hero ke liye "link" empty rakha hai jaisa aapne format mein dikhaya
    const heroData = items.slice(0, 5).map(item => ({
        title: item.title.split('(')[0].trim(), // Title thoda clean kar diya hero ke liye
        desc: item.title, // Full title as description
        poster: item.image, // High Quality image
        rating: "N/A", // Home page par rating nahi hoti
        link: "", // Hero link empty (redirects to search)
        tags: ["Latest", item.category]
    }));

    // 4. Final Output Construction
    const formattedData = {
        success: true,
        data: {
            hero: heroData, // Slider Data
            sections: [
                {
                    title: "Latest on MoviesDrive",
                    items: items // Grid Data
                }
            ]
        }
    };

    return NextResponse.json(formattedData);

  } catch (e) {
    console.error("Scraping Error:", e);
    return NextResponse.json({ success: false, error: "Failed to fetch data" });
  }
}
