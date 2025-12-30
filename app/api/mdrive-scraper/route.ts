import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // 1. Fetch HTML
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 2. Extract Data
    const title = $('.entry-title').text().trim();
    const poster = $('.entry-content img').first().attr('src'); // Pehli image usually poster hoti hai

    const links: any[] = [];
    const processedLinks = new Set(); // Duplicates rokne ke liye

    // 3. Link Extraction Logic (Image & Href Analysis)
    $('.entry-content a').each((i, el) => {
        const href = $(el).attr('href');
        const imgSrc = $(el).find('img').attr('src') || ""; // Link ke andar image dhundo
        const text = $(el).text().trim();

        if (href && !processedLinks.has(href)) {
            let serverName = "";

            // Server Detection Logic (URL ya Image name se)
            if (href.includes('hubcloud') || imgSrc.includes('hubcloud')) serverName = "HubCloud";
            else if (href.includes('gdflix') || imgSrc.includes('gdflix')) serverName = "GDFlix";
            else if (href.includes('drivehub') || imgSrc.includes('drivehub')) serverName = "DriveHub";
            else if (href.includes('katmovie') || imgSrc.includes('katmovie')) serverName = "KatMovie";
            else if (href.includes('gdtot') || imgSrc.includes('gdtot')) serverName = "GDTot";
            else if (href.includes('drive')) serverName = "Google Drive"; 

            // Agar valid server mila to list mein daalo
            if (serverName) {
                processedLinks.add(href);
                links.push({
                    name: serverName,
                    url: href,
                    type: "Direct" // VlyxDrive ke liye flag
                });
            }
        }
    });

    // 4. Return JSON (VlyxDrive Compatible)
    return NextResponse.json({
        success: true,
        data: {
            type: "quality", // Default type
            linkData: [
                {
                    title: "MDrive Links", // Group Title
                    links: links // Saare nikale hue links
                }
            ]
        }
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Scraping Failed' });
  }
}
