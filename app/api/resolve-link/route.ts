// app/api/resolve-link/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  // Helper function to fetch with timeout and headers
  const fetchWithRetry = async (apiUrl: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s Timeout

    try {
      console.log(`Trying API: ${apiUrl}`); // Log URL for debugging
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
    // Attempt 1: Standard URL Format
    try {
      const data = await fetchWithRetry(`https://netvlyx.pages.dev/api/m4ulinks-scraper?url=${encodeURIComponent(url)}`);
      return NextResponse.json({ success: true, data });
    } catch (err1: any) {
      console.warn("Attempt 1 Failed:", err1.message);
      
      // Attempt 2: Alternative URL (User's suggested format /api/scrape)
      // Sometimes APIs are hosted at /api/scrape
      try {
        const data = await fetchWithRetry(`https://netvlyx.pages.dev/api/scrape?url=${encodeURIComponent(url)}`);
        return NextResponse.json({ success: true, data });
      } catch (err2: any) {
        console.warn("Attempt 2 Failed:", err2.message);
        throw new Error(`All attempts failed. Last error: ${err1.message}`);
      }
    }

  } catch (error: any) {
    console.error("Final API Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to resolve link via API' 
    });
  }
}
