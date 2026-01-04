import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { extractImdbId } from '@/lib/scraper-helper'; // Import helper

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url'); // MoviesDrive Page URL (Encoded)

    if (!url) return NextResponse.json({ error: "No URL provided" });

    try {
        const decodedUrl = atob(url).replace(/-/g, '+').replace(/_/g, '/'); // Decode URL
        
        // 1. Page Load Karo
        const res = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await res.text();
        const $ = cheerio.load(html);

        // 2. IMDb ID Extraction (Aapka Naya Feature) 🌟
        const imdbId = extractImdbId(html);

        // 3. Watch Online Link Extraction (HubCloud etc.)
        let streamLink = "";
        $('a.maxbutton-1').each((i, el) => {
            const txt = $(el).text().toLowerCase();
            if (txt.includes('watch') || txt.includes('online') || txt.includes('instant')) {
                streamLink = $(el).attr('href') || "";
            }
        });

        // 4. Return Data
        return NextResponse.json({ 
            success: true, 
            imdbId: imdbId, // Ye ID frontend ko bhejo, wo TMDB se data le lega
            streamLink: streamLink 
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
