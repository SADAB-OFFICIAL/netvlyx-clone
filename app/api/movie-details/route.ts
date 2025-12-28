import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // 1. CALL OFFICIAL NETVLYX API (Links ke liye best)
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

    // --- 2. STRONG TITLE LOGIC (APKE BATAYE HUE FORMULA SE) ---
    // Formula: Bracket '(', '[', ya Dot '.' se pehle jo bhi hai wo utha lo.
    
    const cleanStrongTitle = (rawText: string) => {
        if (!rawText) return "";
        
        // Step A: Hyphens ko space banao (URL slug ke liye)
        let text = rawText.replace(/-/g, ' ');

        // Step B: Break at '(', '[', '.', or 'Season' keywords
        // Regex ka matlab: Ruk jao agar (, [, ., Season, S01, ya 202x dikhe
        const splitRegex = /[\(\[\.]|Season|S\d+|Ep\d+|\b\d{4}\b/i;
        
        // Pehla hissa uthao (Jo main naam hai)
        let cleanPart = text.split(splitRegex)[0];

        // Step C: Safai (Trim extra spaces)
        cleanPart = cleanPart.trim();

        // Step D: Capitalize (Har word ka pehla letter bada)
        return cleanPart.replace(/\b\w/g, (l) => l.toUpperCase());
    };

    // Pehle koshish karo API ke title se
    let finalTitle = cleanStrongTitle(data.title);
    let releaseYear = null;

    // Agar API ka title "Unknown" ya khali nikla, to URL se try karo
    if (!finalTitle || finalTitle.length < 2 || finalTitle.toLowerCase().includes('unknown')) {
        try {
            const slug = new URL(url).pathname.split('/').filter(Boolean).pop() || "";
            
            // Year nikalne ki koshish (Taaki TMDB ko aur help mile)
            const yearMatch = slug.match(/-(\d{4})-/);
            if (yearMatch) releaseYear = yearMatch[1];

            // URL par bhi wahi Strong Cleaner lagao
            finalTitle = cleanStrongTitle(slug);
        } catch (e) {
            finalTitle = "Unknown Movie";
        }
    }

    // --- 3. PROCESS LINKS (Baaki Logic Same) ---
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

    const allSeasons = new Set<number>();
    downloadSections.forEach((sec: any) => { if (sec.season) allSeasons.add(sec.season); });
    
    if (allSeasons.size === 0) {
        const titleRange = (data.title || "").match(/(?:Season|S)\s*(\d+)\s*[-–—]\s*(\d+)/i);
        if (titleRange) {
            for (let i = parseInt(titleRange[1]); i <= parseInt(titleRange[2]); i++) allSeasons.add(i);
        }
    }

    let screenshots = Array.isArray(data.screenshots || data.images) ? (data.screenshots || data.images) : [];

    return NextResponse.json({
        title: finalTitle, // Ab ye ekdum Clean Title hoga
        year: releaseYear,
        poster: data.image || data.poster || "",
        plot: data.description || data.plot || "Overview unavailable.",
        imdbId: null, 
        seasons: Array.from(allSeasons).sort((a, b) => a - b),
        screenshots: screenshots.slice(0, 8),
        downloadSections: downloadSections
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed' });
  }
}
