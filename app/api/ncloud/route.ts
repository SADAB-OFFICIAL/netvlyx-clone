// app/api/ncloud/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // --- STEP 1: First Scrape (Embed Page) ---
    // HubCloud ka main page load karo
    const response1 = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html1 = await response1.text();
    const $1 = cheerio.load(html1);

    // Wahan se 'Download' ya 'Play' button ka link nikalo
    // HubCloud aksar ek button deta hai jo next step par le jata hai
    let step2Url = $1('a:contains("Download")').attr('href') || 
                   $1('a:contains("Play")').attr('href') ||
                   $1('.btn-success').attr('href');

    if (!step2Url) {
        // Fallback: Agar button nahi mila, toh shayad ye direct link ho
        // Ya script ke andar chupa ho
        throw new Error("Step 1 Failed: Could not find intermediate link");
    }

    // --- STEP 2: Second Scrape (Intermediate Page) ---
    // Ab us intermediate link par jao
    const response2 = await fetch(step2Url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html2 = await response2.text();
    const $2 = cheerio.load(html2);

    // Ab final 'Generate Link' ya direct video URL dhundo
    // HubCloud final page par aksar ek redirect ya direct link deta hai
    let finalLink = $2('a:contains("Download Link")').attr('href') ||
                    $2('.btn-primary').attr('href');
    
    // Kabhi kabhi final link script tag me hoti hai (window.location = "...")
    if (!finalLink) {
        const scriptContent = $2('script:contains("window.location")').html();
        if (scriptContent) {
            const match = scriptContent.match(/window\.location\s*=\s*['"]([^'"]+)['"]/);
            if (match) finalLink = match[1];
        }
    }

    // --- Verification ---
    if (!finalLink) throw new Error("Step 2 Failed: Could not extract tokenized URL");

    // Agar link relative hai to usse absolute banao
    // (e.g., "/video/abc" -> "https://hubcloud.run/video/abc")
    if (finalLink.startsWith('/')) {
        const baseUrl = new URL(step2Url).origin;
        finalLink = `${baseUrl}${finalLink}`;
    }

    return NextResponse.json({ 
        success: true, 
        streamUrl: finalLink,
        message: "Secure Link Generated"
    });

  } catch (error: any) {
    console.error("N-Cloud Scrape Error:", error.message);
    return NextResponse.json({ success: false, error: 'Failed to generate secure stream.' });
  }
}
