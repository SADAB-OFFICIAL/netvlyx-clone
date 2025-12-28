// app/api/movie-details/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // 1. USE NETVLYX PROXY (The Fix)
    // Direct fetch block ho sakta hai, isliye proxy use kar rahe hain
    const proxyUrl = `https://proxy.vlyx.workers.dev/?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error("Proxy Fetch Failed");
    const html = await response.text();
    const $ = cheerio.load(html);

    // --- 2. BASIC DETAILS ---
    const title = $('h1.entry-title, .title').first().text().trim();
    
    // Poster Priority: Post Thumbnail -> First Content Image -> Meta Image
    let poster = $('.post-thumbnail img').attr('src') || 
                 $('.entry-content img').first().attr('src') ||
                 $('meta[property="og:image"]').attr('content');

    // --- 3. OVERVIEW / PLOT FIX ---
    // NetVlyx style: Pehle 1-2 paragraphs ko uthao jo "Download" ya "Join" na ho
    let plotArr: string[] = [];
    $('.entry-content p, .post-content p').each((i, el) => {
        const text = $(el).text().trim();
        // Filter junk text
        if (text.length > 40 && !text.toLowerCase().includes('download') && !text.toLowerCase().includes('telegram') && !text.toLowerCase().includes('whatsapp')) {
            plotArr.push(text);
        }
    });
    // Join first 2 paragraphs for a good description
    const plot = plotArr.slice(0, 2).join('\n\n') || "Overview not available.";

    // --- 4. SCREENSHOTS FIX (.ss-img Logic) ---
    const screenshots: string[] = [];
    
    // Priority 1: NetVlyx ka specific class (.ss-img)
    $('.ss-img img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src) screenshots.push(src);
    });

    // Priority 2: Agar .ss-img na mile, to Content images dhoondo
    if (screenshots.length === 0) {
        $('.entry-content img, .post-content img').each((i, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src');
            // Filter poster and icons
            if (src && src !== poster && !src.includes('icon') && !src.includes('button') && !src.includes('logo')) {
                screenshots.push(src);
            }
        });
    }

    // --- 5. LINKS & SEASONS ---
    const downloadSections: any[] = [];
    let detectedSeasons = new Set<number>();

    // Helper to check valid links
    const isValidLink = (href: string) => 
        href && (href.includes('drive') || href.includes('hub') || href.includes('cloud') || href.includes('gdflix') || href.includes('file') || href.includes('workers.dev'));

    // Scan Headings for Sections
    $('h3, h4, h5, h6, strong, b').each((i, el) => {
        const headingText = $(el).text().trim();
        const lowerHeading = headingText.toLowerCase();

        // Keywords
        if (lowerHeading.match(/480p|720p|1080p|2160p|4k|season|episode|download|zip|pack/)) {
            
            // Detect Season
            let sectionSeason: number | null = null;
            const sMatch = headingText.match(/(?:Season|S)\s*0?(\d+)/i);
            if (sMatch) {
                sectionSeason = parseInt(sMatch[1]);
                detectedSeasons.add(sectionSeason);
            }

            // Detect Quality
            let quality = 'Standard';
            if (lowerHeading.includes('4k') || lowerHeading.includes('2160p')) quality = '4K';
            else if (lowerHeading.includes('1080p')) quality = '1080p';
            else if (lowerHeading.includes('720p')) quality = '720p';
            else if (lowerHeading.includes('480p')) quality = '480p';

            // Find Links
            const links: any[] = [];
            
            // Strategy: Look at siblings until next header
            $(el).nextUntil('h3, h4, h5, h6').each((j, sib) => {
                // Direct links
                if ($(sib).is('a')) {
                    const href = $(sib).attr('href');
                    if (isValidLink(href || '')) links.push({ label: $(sib).text().trim(), url: href });
                }
                // Links inside paragraphs/divs
                $(sib).find('a').each((k, child) => {
                    const href = $(child).attr('href');
                    if (isValidLink(href || '')) links.push({ label: $(child).text().trim(), url: href });
                });
            });

            if (links.length > 0) {
                downloadSections.push({
                    title: headingText,
                    season: sectionSeason,
                    quality: quality,
                    links: links
                });
            }
        }
    });

    // Handle Title Ranges (Season 1-5)
    const rangeMatch = title.match(/(?:Season|S)\s*(\d+)\s*[-–—]\s*(\d+)/i);
    if (detectedSeasons.size === 0 && rangeMatch) {
        const start = parseInt(rangeMatch[1]);
        const end = parseInt(rangeMatch[2]);
        for (let i = start; i <= end; i++) detectedSeasons.add(i);
    }

    return NextResponse.json({
        title,
        poster,
        plot,
        seasons: Array.from(detectedSeasons).sort((a,b) => a - b),
        screenshots: [...new Set(screenshots)].slice(0, 10), // Unique & Limited
        downloadSections
    });

  } catch (error: any) {
    console.error("Scraper Error:", error.message);
    return NextResponse.json({ error: 'Failed to fetch details' });
  }
}
