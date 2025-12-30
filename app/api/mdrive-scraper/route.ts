import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // --- 1. Basic Details ---
    const title = $('.entry-title').text().trim();
    const poster = $('.entry-content img').first().attr('src');

    // --- 2. Intelligent Parsing (Series vs Movie) ---
    const episodeGroups: any[] = [];
    let currentEpisode: any = null;
    
    // Movie Mode Fallback Container
    const movieLinks: any[] = [];

    // Helper to detect server name
    const getServerName = (el: any) => {
        const href = $(el).attr('href') || "";
        const imgSrc = $(el).find('img').attr('src') || "";
        const text = $(el).text().trim().toLowerCase();

        if (href.includes('hubcloud') || imgSrc.includes('hubcloud') || text.includes('hubcloud')) return "HubCloud";
        if (href.includes('gdflix') || imgSrc.includes('gdflix') || text.includes('gdflix')) return "GDFlix";
        if (href.includes('drivehub') || imgSrc.includes('drivehub')) return "DriveHub";
        if (href.includes('katmovie') || imgSrc.includes('katmovie')) return "KatMovie";
        if (href.includes('gdtot') || imgSrc.includes('gdtot')) return "GDTot";
        if (href.includes('drive') || text.includes('drive')) return "Google Drive";
        
        return "Direct Link";
    };

    // Iterate over all potential content blocks (headings and paragraphs)
    // MDrive uses <h5> for headers AND links mostly
    $('.entry-content h5, .entry-content p, .entry-content h4').each((i, el) => {
        const text = $(el).text().trim();
        const $link = $(el).find('a').first();
        const hasLink = $link.length > 0;

        // --- A. DETECT EPISODE HEADER ---
        // Regex looks for "Ep01", "Episode 1", "Ep. 1" etc.
        const epMatch = text.match(/(?:Ep|Episode)\s*\.?\s*(\d+)/i);

        if (epMatch && !hasLink) {
            // Found a new episode header (e.g. "Ep01 - 1080p")
            const epNum = parseInt(epMatch[1]);
            
            // Start a new group
            currentEpisode = {
                title: text, // e.g. "Ep01 - 1080p [1GB]"
                episodeNumber: epNum,
                links: []
            };
            episodeGroups.push(currentEpisode);
        }
        
        // --- B. DETECT LINK ---
        else if (hasLink) {
            const href = $link.attr('href') || "";
            // Check if it's a valid drive link
            if (href.includes('drive') || href.includes('hub') || href.includes('cloud') || href.includes('gdflix')) {
                 const linkObj = {
                    name: getServerName($link),
                    url: href,
                    type: "Direct"
                 };

                 if (currentEpisode) {
                     // Add to current Episode (Series Mode)
                     currentEpisode.links.push(linkObj);
                 } else {
                     // No episode header seen yet? Add to Movie list (Movie Mode)
                     movieLinks.push(linkObj);
                 }
            }
        }
    });

    // --- 3. Construct Final Response ---
    let finalData;

    if (episodeGroups.length > 0) {
        // It's a Series
        finalData = {
            type: "episode",
            linkData: episodeGroups.map(grp => ({
                title: grp.title,
                episodeNumber: grp.episodeNumber,
                links: grp.links
            }))
        };
    } else {
        // It's a Movie (No "Ep" headers found)
        finalData = {
            type: "quality",
            linkData: [{
                title: "Download Links",
                links: movieLinks
            }]
        };
    }

    return NextResponse.json({
        success: true,
        data: finalData
    });

  } catch (e) {
    console.error("MDrive Scraper Error:", e);
    return NextResponse.json({ success: false, error: 'Scraping Failed' });
  }
}
