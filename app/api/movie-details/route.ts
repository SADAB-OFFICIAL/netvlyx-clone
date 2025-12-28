import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // 1. CALL OFFICIAL NETVLYX API (Ye LINKS ke liye best hai)
    const targetApi = `https://netvlyx.pages.dev/api/m4ulinks-scraper?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(targetApi, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://netvlyx.pages.dev/',
        'Origin': 'https://netvlyx.pages.dev'
      },
      next: { revalidate: 300 }
    });

    let data: any = { title: "Unknown", linkData: [], description: "", screenshots: [] };
    if (response.ok) {
        try { 
            const jsonData = await response.json();
            data = { ...data, ...jsonData };
        } catch (e) {}
    }

    // --- 2. SMART TITLE LOGIC (Jo abhi banaya tha) ---
    // Agar API ne title nahi diya ya 'Unknown' diya, to URL se nikalo
    let finalTitle = data.title;
    let releaseYear = null;

    if (!finalTitle || finalTitle.toLowerCase().includes('unknown')) {
        try {
            const slug = new URL(url).pathname.split('/').filter(Boolean).pop() || "";
            
            // Year nikalne ki koshish (e.g. pathaan-2023)
            const yearMatch = slug.match(/-(\d{4})-/);
            if (yearMatch) releaseYear = yearMatch[1];

            // Title Clean karo
            finalTitle = slug
                .replace(/-(\d{4})-.*$/, '') 
                .replace(/-/g, ' ')
                .replace(/\b(download|movie|hindi|dubbed|dual|audio|season|episode|s\d+|e\d+|480p|720p|1080p|4k|web-dl|bluray|hdrip|multi|org)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
            finalTitle = finalTitle.replace(/\b\w/g, (l: string) => l.toUpperCase());
        } catch (e) {
            finalTitle = "Unknown Movie";
        }
    }

    // --- 3. PROCESS LINKS (Official API Data se) ---
    const downloadSections = (data.linkData || []).map((item: any) => {
        let season = null;
        const sMatch = (item.quality || "").match(/(?:Season|S)\s*0?(\d+)/i);
        if (sMatch) season = parseInt(sMatch[1]);

        let quality = (item.quality || "Standard").replace(/\s*\[.*?\]/g, "").trim();
        if (quality.match(/4k|2160p/i)) quality = '4K';
        else if (quality.match(/1080p/i)) quality = '1080p';
        else if (quality.match(/720p/i)) quality = '720p';
        else if (quality.match(/480p/i)) quality = '480p';

        // Pack Detection
        const sectionIsPack = /pack|zip|batch|complete|collection|volume/i.test(item.quality || "");

        return {
            title: item.quality,
            quality: quality,
            size: item.size,
            season: season,
            links: (item.links || []).map((l: any) => ({
                label: l.name || 'Download Server',
                url: l.url,
                isZip: sectionIsPack || /zip|pack|batch/i.test(l.name || "")
            }))
        };
    });

    // Detect Seasons
    const allSeasons = new Set<number>();
    downloadSections.forEach((sec: any) => { if (sec.season) allSeasons.add(sec.season); });
    
    if (allSeasons.size === 0) {
        const titleRange = (finalTitle || "").match(/(?:Season|S)\s*(\d+)\s*[-–—]\s*(\d+)/i);
        if (titleRange) {
            for (let i = parseInt(titleRange[1]); i <= parseInt(titleRange[2]); i++) allSeasons.add(i);
        }
    }

    // --- 4. SCREENSHOTS ---
    // Official API 'screenshots' ya 'images' bhejti hai jo Source se hote hain
    let screenshots = Array.isArray(data.screenshots || data.images) ? (data.screenshots || data.images) : [];

    return NextResponse.json({
        title: finalTitle,
        year: releaseYear,
        poster: data.image || data.poster || "",
        plot: data.description || data.plot || "Overview unavailable.",
        imdbId: null, // Frontend dhoond lega
        seasons: Array.from(allSeasons).sort((a, b) => a - b),
        screenshots: screenshots.slice(0, 8),
        downloadSections: downloadSections
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed' });
  }
}
