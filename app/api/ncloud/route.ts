// app/api/ncloud/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // --- STEP 1: First Scrape (Embed Page) ---
    const response1 = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
    });
    
    if (!response1.ok) throw new Error(`HubCloud Page 1 Error: ${response1.status}`);
    
    const html1 = await response1.text();
    const $1 = cheerio.load(html1);

    // Multiple patterns to find the button
    let step2Url = $1('a:contains("Download")').attr('href') || 
                   $1('a:contains("Play")').attr('href') ||
                   $1('a.btn-success').attr('href') ||
                   $1('a.btn-primary').attr('href') ||
                   $1('a[href*="/drive/"]').attr('href') || // Common HubCloud pattern
                   $1('a[href*="/video/"]').attr('href');

    if (!step2Url) {
       console.error("Step 1 HTML Preview:", html1.substring(0, 500)); // Debug log
       throw new Error("Step 1 Failed: Button not found on HubCloud page");
    }

    // Handle relative URLs
    if (step2Url.startsWith('/')) {
        const urlObj = new URL(url);
        step2Url = `${urlObj.origin}${step2Url}`;
    }

    // --- STEP 2: Second Scrape (Intermediate Page) ---
    const response2 = await fetch(step2Url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html2 = await response2.text();
    const $2 = cheerio.load(html2);

    // Final Link Patterns
    let finalLink = $2('a:contains("Download Link")').attr('href') ||
                    $2('a.btn-success').attr('href') ||
                    $2('a.btn-primary').attr('href') ||
                    $2('a[href*=".mkv"]').attr('href') ||
                    $2('a[href*=".mp4"]').attr('href');

    // JS Redirect Fallback
    if (!finalLink) {
        const scriptContent = $2('script:contains("window.location")').html();
        if (scriptContent) {
            const match = scriptContent.match(/window\.location\s*=\s*['"]([^'"]+)['"]/);
            if (match) finalLink = match[1];
        }
    }

    if (!finalLink) throw new Error("Step 2 Failed: Final stream link not found");

    return NextResponse.json({ 
        success: true, 
        streamUrl: finalLink,
        message: "Stream Generated"
    });

  } catch (error: any) {
    console.error("N-Cloud API Error:", error.message);
    return NextResponse.json({ success: false, error: error.message || 'Scraping failed' });
  }
}
