// app/api/movie-details/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // 1. USE PROXY (Movies4u Block Bypass)
    const proxyUrl = `https://proxy.vlyx.workers.dev/?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
    });
    
    if (!response.ok) throw new Error("Proxy Failed");
    const html = await response.text();
    const $ = cheerio.load(html);

    // --- 2. BASIC INFO ---
    const title = $('h1.entry-title, .title').first().text().trim();
    let poster = $('.post-thumbnail img').attr('src') || $('.entry-content img').first().attr('src');
    
    let plot = '';
    $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 50 && !text.includes('Download') && !text.includes('Join') && !plot) plot = text;
    });

    // --- 3. DETECT SEASONS ---
    let detectedSeasons = new Set<number>();
    const rangeMatch = title.match(/(?:Season|S)\s*(\d+)\s*[-–—]\s*(\d+)/i);
    if (rangeMatch) {
        const start = parseInt(rangeMatch[1]);
        const end = parseInt(rangeMatch[2]);
        for (let i = start; i <= end; i++) detectedSeasons.add(i);
    }

    // --- 4. SCREENSHOTS ---
    const screenshots: string[] = [];
    $('.entry-content img, .post-content img, .ss-img img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src !== poster && !src.includes('icon') && !src.includes('button') && !src.includes('logo')) {
            screenshots.push(src);
        }
    });
    const uniqueScreenshots = [...new Set(screenshots)].slice(0, 8);

    // --- 5. SMART LINK PARSER ---
    const downloadSections: any[] = [];
    
    let currentSeason: number | null = null;
    let currentQuality = 'Standard';
    let currentSectionTitle = 'Downloads';
    let currentLinks: any[] = [];

    const saveGroup = () => {
        if (currentLinks.length > 0) {
            downloadSections.push({
                title: currentSectionTitle,
                season: currentSeason,
                quality: currentQuality,
                links: [...currentLinks]
            });
            currentLinks = [];
        }
    };

    $('.entry-content').find('h3, h4, h5, h6, p, div, span, strong, b, a').each((i, el) => {
        const text = $(el).text().trim();
        const lowerText = text.toLowerCase();
        
        // --- FIX IS HERE ---
        // Humne 'tagName' ko safely access kiya hai (?.) aur fallback diya hai (|| '')
        const tagName = $(el).prop('tagName')?.toLowerCase() || ''; 

        // 1. DETECT HEADERS
        if (['h3', 'h4', 'h5', 'h6', 'strong', 'b'].includes(tagName) || (tagName === 'p' && $(el).children('strong').length > 0)) {
            
            const sMatch = text.match(/(?:Season|S)\s*0?(\d+)/i);
            if (sMatch) {
                saveGroup();
                currentSeason = parseInt(sMatch[1]);
                detectedSeasons.add(currentSeason);
                currentSectionTitle = text;
            }

            if (lowerText.includes('480p')) { saveGroup(); currentQuality = '480p'; currentSectionTitle = text; }
            else if (lowerText.includes('720p')) { saveGroup(); currentQuality = '720p'; currentSectionTitle = text; }
            else if (lowerText.includes('1080p')) { saveGroup(); currentQuality = '1080p'; currentSectionTitle = text; }
            else if (lowerText.includes('4k') || lowerText.includes('2160p')) { saveGroup(); currentQuality = '4K'; currentSectionTitle = text; }
        }

        // 2. DETECT LINKS
        const linkEls = $(el).is('a') ? [el] : $(el).find('a').toArray();
        
        linkEls.forEach((linkEl: any) => {
            const href = $(linkEl).attr('href');
            const label = $(linkEl).text().trim();
            
            if (href && (href.includes('drive') || href.includes('hub') || href.includes('cloud') || href.includes('gdflix') || href.includes('file') || href.includes('pixel') || href.includes('workers.dev'))) {
                
                const isZip = label.toLowerCase().includes('zip') || label.toLowerCase().includes('pack') || label.toLowerCase().includes('batch');
                
                let linkQuality = currentQuality;
                if (label.includes('480p')) linkQuality = '480p';
                if (label.includes('720p')) linkQuality = '720p';
                if (label.includes('1080p')) linkQuality = '1080p';

                currentLinks.push({
                    label: label || 'Download',
                    url: href,
                    isZip: isZip,
                    quality: linkQuality
                });
            }
        });
    });
    saveGroup();

    const sortedSeasons = Array.from(detectedSeasons).sort((a,b) => a - b);

    return NextResponse.json({
        title, poster, plot,
        type: sortedSeasons.length > 0 ? 'Series' : 'Movie',
        seasons: sortedSeasons,
        screenshots: uniqueScreenshots,
        downloadSections
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed' });
  }
}
