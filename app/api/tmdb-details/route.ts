import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // 1. CALL NETVLYX API
    const targetApi = `https://netvlyx.pages.dev/api/m4ulinks-scraper?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(targetApi, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://netvlyx.pages.dev/',
        'Origin': 'https://netvlyx.pages.dev'
      },
      next: { revalidate: 300 }
    });

    let data = { title: "Unknown", linkData: [], description: "", screenshots: [] };
    if (response.ok) {
        try { data = await response.json(); } catch (e) {}
    }

    // --- FIX: SMART TITLE FALLBACK (URL se Title nikalo) ---
    let finalTitle = data.title;
    
    // Agar Title 'Unknown' hai ya missing hai, to URL se generate karo
    if (!finalTitle || finalTitle.toLowerCase() === 'unknown' || finalTitle.toLowerCase() === 'unknown title') {
        try {
            // URL slug nikalo (e.g. /stranger-things-season-4-download/)
            const slug = new URL(url).pathname.split('/').filter(Boolean).pop() || "";
            
            // Clean up: hyphen hatana, keywords hatana
            finalTitle = slug
                .replace(/-/g, ' ') // Replace - with space
                .replace(/\b(download|movie|hindi|dual|audio|480p|720p|1080p|4k|season|episode|s\d+|e\d+|web-dl|bluray|hdrip)\b/gi, '') // Remove junk words
                .replace(/\s+/g, ' ') // Remove extra spaces
                .trim();
                
            // Capitalize First Letters
            finalTitle = finalTitle.replace(/\b\w/g, l => l.toUpperCase());
        } catch (e) {
            finalTitle = "Unknown Movie";
        }
    }

    // 2. PROCESS DATA
    const plot = data.description || data.plot || data.story || "Overview unavailable.";
    let screenshots = Array.isArray(data.screenshots || data.images) ? (data.screenshots || data.images) : [];

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

    const allSeasons = new Set<number>();
    downloadSections.forEach((sec: any) => { if (sec.season) allSeasons.add(sec.season); });
    
    if (allSeasons.size === 0) {
        const titleRange = (finalTitle || "").match(/(?:Season|S)\s*(\d+)\s*[-–—]\s*(\d+)/i);
        if (titleRange) {
            for (let i = parseInt(titleRange[1]); i <= parseInt(titleRange[2]); i++) allSeasons.add(i);
        }
    }

    return NextResponse.json({
        title: finalTitle, // ✅ Now correct!
        poster: data.image || data.poster || "",
        plot: plot,
        imdbId: null, 
        seasons: Array.from(allSeasons).sort((a, b) => a - b),
        screenshots: screenshots.slice(0, 8),
        downloadSections: downloadSections
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed' });
  }
}
