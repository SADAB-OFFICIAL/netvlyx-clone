import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
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

    // --- 1. HIDDEN IMDB ID SEARCH ---
    // Kabhi-kabhi description mein ID hoti hai
    let imdbId = null;
    const allText = JSON.stringify(data).toLowerCase();
    const idMatch = allText.match(/tt\d{7,}/); // Looks for tt1234567
    if (idMatch) imdbId = idMatch[0];

    // --- 2. SMART TITLE & YEAR EXTRACTION ---
    let finalTitle = data.title;
    let releaseYear = null;

    if (!finalTitle || finalTitle.toLowerCase().includes('unknown') || !imdbId) {
        try {
            const slug = new URL(url).pathname.split('/').filter(Boolean).pop() || "";
            
            // A. Extract Year (e.g. pathaan-2023-download)
            const yearMatch = slug.match(/-(\d{4})-/);
            if (yearMatch) {
                releaseYear = yearMatch[1];
            }

            // B. Clean Title
            finalTitle = slug
                .replace(/-(\d{4})-.*$/, '') // Remove year and everything after
                .replace(/-/g, ' ')
                .replace(/\b(download|movie|hindi|dubbed|dual|audio|season|episode|s\d+|e\d+|480p|720p|1080p|4k|web-dl|bluray|hdrip|multi|org)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
                
            // Capitalize
            finalTitle = finalTitle.replace(/\b\w/g, (l: string) => l.toUpperCase());
        } catch (e) {
            finalTitle = "Unknown Movie";
        }
    }

    // 3. Process Data
    const plot = data.description || data.plot || "Overview unavailable.";
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

    return NextResponse.json({
        title: finalTitle,
        year: releaseYear, // ✅ Bheja frontend ko
        poster: data.image || data.poster || "",
        plot: plot,
        imdbId: imdbId, // ✅ Agar mila to bheja
        seasons: Array.from(allSeasons).sort((a, b) => a - b),
        screenshots: screenshots.slice(0, 8),
        downloadSections: downloadSections
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed' });
  }
}
