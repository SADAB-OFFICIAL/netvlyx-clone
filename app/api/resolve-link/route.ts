import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  // 1. Base URL Nikalo (Local API calls ke liye zaroori hai)
  const { protocol, host } = new URL(request.url);
  const baseUrl = `${protocol}//${host}`;

  // --- HELPER: Fetch with Timeout & Headers (Purana Logic) ---
  const fetchWithRetry = async (apiUrl: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s Timeout

    try {
      console.log(`Trying API: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://netvlyx.pages.dev/',
          'Origin': 'https://netvlyx.pages.dev'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${text.substring(0, 100)}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  };

  try {
    // ============================================================
    // 🟢 NEW LOGIC: DETECT MDRIVE LINKS
    // ============================================================
    // Agar link mein 'mdrive' ya 'archives' hai, toh Local Scraper use karo
    if (url.includes('mdrive') || url.includes('archives')) {
        console.log("🚀 Switching to Local MDrive Scraper for:", url);
        
        // Internal call to your new API
        const res = await fetch(`${baseUrl}/api/mdrive-scraper?url=${encodeURIComponent(url)}`, {
             cache: 'no-store'
        });
        
        if (!res.ok) throw new Error("Local MDrive Scraper Failed");
        
        const data = await res.json();
        // Direct return (Format already match kar diya hai humne scraper mein)
        return NextResponse.json(data);
    }

    // ============================================================
    // 🟠 OLD LOGIC: M4ULINKS / OFFICIAL API FALLBACK
    // ============================================================
    
    // Attempt 1: Standard URL Format
    try {
      const data = await fetchWithRetry(`https://netvlyx.pages.dev/api/m4ulinks-scraper?url=${encodeURIComponent(url)}`);
      return NextResponse.json({ success: true, data });
    } catch (err1: any) {
      console.warn("Attempt 1 Failed:", err1.message);
      
      // Attempt 2: Alternative Endpoint (Retry)
      try {
        const data = await fetchWithRetry(`https://netvlyx.pages.dev/api/scrape?url=${encodeURIComponent(url)}`);
        return NextResponse.json({ success: true, data });
      } catch (err2: any) {
        console.warn("Attempt 2 Failed:", err2.message);
        throw new Error(`All attempts failed. Last error: ${err1.message}`);
      }
    }

  } catch (error: any) {
    console.error("Final Resolver Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to resolve link via API' 
    });
  }
}
