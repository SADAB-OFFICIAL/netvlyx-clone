// app/api/movie-details/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // 1. CALL OFFICIAL NETVLYX API (Stable Source)
    // Ye API saara data (Links, Plot, Images) json format mein deti hai
    const targetApi = `https://netvlyx.pages.dev/api/m4ulinks-scraper?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(targetApi, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://netvlyx.pages.dev/',
        'Origin': 'https://netvlyx.pages.dev'
      },
      next: { revalidate: 300 } // Cache data for 5 mins for speed
    });

    if (!response.ok) throw new Error("NetVlyx API Failed");
    const data = await response.json();

    // 2. PROCESS DATA (Cleanup)
    
    // A. Screenshots Extract Karo
    // Official API kabhi 'images' bhejti hai, kabhi 'screenshots'
    let screenshots = data.screenshots || data.images || [];
    // Agar API ne screenshots nahi diye, to hum empty rakhenge (Frontend 'No Screenshots' dikhayega)
    if (!Array.isArray(screenshots)) screenshots = [];

    // B. Plot (Story) Extract Karo
    const plot = data.description || data.plot || data.story || "No overview available.";

    // C. Links & Seasons Process Karo
    const downloadSections = (data.linkData || []).map((item: any) => {
        // Season Detection from Quality String (e.g. "S01 720p")
        let season = null;
        const sMatch = (item.quality || "").match(/(?:Season|S)\s*0?(\d+)/i);
        if (sMatch) season = parseInt(sMatch[1]);

        // Clean Quality (Remove size info like [1GB])
        let quality = (item.quality || "Standard").replace(/\s*\[.*?\]/g, "").trim();
        if (quality.includes('4k') || quality.includes('2160p')) quality = '4K';
        else if (quality.includes('1080p')) quality = '1080p';
        else if (quality.includes('720p')) quality = '720p';
        else if (quality.includes('480p')) quality = '480p';

        return {
            title: item.quality,
            quality: quality,
            size: item.size,
            season: season,
            links: (item.links || []).map((l: any) => ({
                label: l.name || 'Download Server',
                url: l.url,
                // Check if it's a Batch/Zip link
                isZip: (l.name || "").toLowerCase().includes('zip') || 
                       (l.name || "").toLowerCase().includes('pack') ||
                       (l.name || "").toLowerCase().includes('batch')
            }))
        };
    });

    // Extract all unique seasons found for the filter
    const allSeasons = new Set<number>();
    downloadSections.forEach((sec: any) => {
        if (sec.season) allSeasons.add(sec.season);
    });
    
    // Fallback: Check title for season range (e.g. "Season 1-5")
    if (allSeasons.size === 0) {
        const titleRange = (data.title || "").match(/(?:Season|S)\s*(\d+)\s*[-–—]\s*(\d+)/i);
        if (titleRange) {
            const start = parseInt(titleRange[1]);
            const end = parseInt(titleRange[2]);
            for (let i = start; i <= end; i++) allSeasons.add(i);
        }
    }

    return NextResponse.json({
        title: data.title || "Unknown Title",
        poster: data.image || data.poster || "",
        plot: plot, // ✅ Official Plot
        seasons: Array.from(allSeasons).sort((a, b) => a - b),
        screenshots: screenshots.slice(0, 8), // ✅ Official Screenshots (Max 8)
        downloadSections: downloadSections
    });

  } catch (error: any) {
    console.error("API Proxy Error:", error.message);
    return NextResponse.json({ error: 'Failed to fetch data' });
  }
}
