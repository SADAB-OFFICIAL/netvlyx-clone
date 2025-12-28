// app/api/movie-details/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // 1. CALL OFFICIAL NETVLYX API (From your ex.py)
    const targetApi = `https://netvlyx.pages.dev/api/m4ulinks-scraper?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(targetApi, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://netvlyx.pages.dev/',
        'Origin': 'https://netvlyx.pages.dev'
      },
      next: { revalidate: 300 } // Cache for 5 mins
    });

    if (!response.ok) throw new Error("NetVlyx API Failed");
    const data = await response.json();

    // 2. TRANSFORM DATA FOR FRONTEND
    // API returns 'linkData'. We map it to our 'downloadSections' format.
    
    const downloadSections = (data.linkData || []).map((item: any) => {
        // Item looks like: { quality: "720p", size: "1GB", links: [...] }
        
        // Detect Season from Quality Label (e.g. "S01 720p")
        let season = null;
        const sMatch = (item.quality || "").match(/(?:Season|S)\s*0?(\d+)/i);
        if (sMatch) season = parseInt(sMatch[1]);

        // Clean Quality Label (remove size if present to avoid dupes)
        let quality = (item.quality || "Standard").replace(/\s*\[.*?\]/g, "").trim();
        if (quality.includes('4k') || quality.includes('2160p')) quality = '4K';
        else if (quality.includes('1080p')) quality = '1080p';
        else if (quality.includes('720p')) quality = '720p';
        else if (quality.includes('480p')) quality = '480p';

        return {
            title: item.quality, // Full title e.g. "720p [1GB]"
            quality: quality,    // Normalized e.g. "720p"
            size: item.size,
            season: season,
            links: (item.links || []).map((l: any) => ({
                label: l.name || 'Download Server', // e.g. "HubCloud", "V-Cloud"
                url: l.url,
                isZip: (l.name || "").toLowerCase().includes('zip') || (l.name || "").toLowerCase().includes('pack')
            }))
        };
    });

    // Extract all unique seasons found
    const allSeasons = new Set<number>();
    downloadSections.forEach((sec: any) => {
        if (sec.season) allSeasons.add(sec.season);
    });
    
    // If no seasons found in sections, but title says "Season 1-5"
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
        plot: data.description || data.plot || "No description available.",
        seasons: Array.from(allSeasons).sort((a, b) => a - b),
        screenshots: data.screenshots || [], // API usually provides this
        downloadSections: downloadSections
    });

  } catch (error: any) {
    console.error("API Proxy Error:", error.message);
    return NextResponse.json({ error: 'Failed to fetch data' });
  }
}
