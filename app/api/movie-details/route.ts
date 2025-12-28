import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // 1. CALL OFFICIAL NETVLYX API (Stable Source)
    // Yeh API humein bana-banaya data degi (Links, Quality, Plot etc.)
    const targetApi = `https://netvlyx.pages.dev/api/m4ulinks-scraper?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(targetApi, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://netvlyx.pages.dev/',
        'Origin': 'https://netvlyx.pages.dev'
      },
      next: { revalidate: 300 } // 5 min cache
    });

    if (!response.ok) throw new Error("NetVlyx API Failed");
    const data = await response.json();

    // 2. DATA PROCESSING (Frontend ke liye format karna)

    // A. Plot & Screenshots
    const plot = data.description || data.plot || data.story || "No overview available.";
    
    let screenshots = data.screenshots || data.images || [];
    if (!Array.isArray(screenshots)) screenshots = [];

    // B. IMDb ID Extraction (Agar API text mein IMDb link de)
    let imdbId = null;
    // Kabhi kabhi description ya title mein hidden hota hai, par frontend title se bhi dhund lega.
    // Hum koshish karte hain agar API ne koi meta data bheja ho.
    
    // C. PROCESS LINKS (Ye sabse important hai)
    // API 'linkData' bhejti hai, hum usse 'downloadSections' banayenge
    const downloadSections = (data.linkData || []).map((item: any) => {
        // Season Detection (e.g. "S01 720p")
        let season = null;
        const sMatch = (item.quality || "").match(/(?:Season|S)\s*0?(\d+)/i);
        if (sMatch) season = parseInt(sMatch[1]);

        // Clean Quality Name
        let quality = (item.quality || "Standard").replace(/\s*\[.*?\]/g, "").trim();
        // Normalize Quality
        if (quality.match(/4k|2160p/i)) quality = '4K';
        else if (quality.match(/1080p/i)) quality = '1080p';
        else if (quality.match(/720p/i)) quality = '720p';
        else if (quality.match(/480p/i)) quality = '480p';

        // Check if it's a "Pack" section
        const sectionIsPack = /pack|zip|batch|complete|collection|volume/i.test(item.quality || "");

        return {
            title: item.quality, // Full title e.g. "Season 1 720p [Pack]"
            quality: quality,    // Normalized e.g. "720p"
            size: item.size,
            season: season,
            links: (item.links || []).map((l: any) => ({
                label: l.name || 'Download Server',
                url: l.url,
                // Mark link as Zip if section is Pack OR link name has Zip
                isZip: sectionIsPack || /zip|pack|batch/i.test(l.name || "")
            }))
        };
    });

    // Detect All Seasons for Filtering
    const allSeasons = new Set<number>();
    downloadSections.forEach((sec: any) => { if (sec.season) allSeasons.add(sec.season); });
    
    // Fallback: Agar sections mein season nahi mila par Title mein "Season 1-5" hai
    if (allSeasons.size === 0) {
        const titleRange = (data.title || "").match(/(?:Season|S)\s*(\d+)\s*[-–—]\s*(\d+)/i);
        if (titleRange) {
            for (let i = parseInt(titleRange[1]); i <= parseInt(titleRange[2]); i++) allSeasons.add(i);
        }
    }

    return NextResponse.json({
        title: data.title || "Unknown",
        poster: data.image || data.poster || "",
        plot: plot,
        imdbId: imdbId, // Frontend TMDB se verify karega
        seasons: Array.from(allSeasons).sort((a, b) => a - b),
        screenshots: screenshots.slice(0, 8),
        downloadSections: downloadSections
    });

  } catch (error: any) {
    console.error("API Error:", error.message);
    return NextResponse.json({ error: 'Failed to fetch data' });
  }
}
