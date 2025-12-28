// app/api/search/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('s');

  if (!query) return NextResponse.json({ success: false, error: 'Query required' });

  // 1. Target Real NetVlyx API
  const TARGET_URL = `https://netvlyx.pages.dev/api/movies4u-search?s=${encodeURIComponent(query)}`;

  // 2. Secret Headers (Bypass Protection)
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Referer": "https://netvlyx.pages.dev/",
    "Origin": "https://netvlyx.pages.dev"
  };

  try {
    const response = await fetch(TARGET_URL, { headers, next: { revalidate: 0 } });
    
    if (!response.ok) throw new Error("Failed to fetch from NetVlyx");
    
    const data = await response.json();
    
    // NetVlyx returns { results: [...] }
    return NextResponse.json({ success: true, results: data.results || [] });

  } catch (error: any) {
    console.error("Search Proxy Error:", error.message);
    return NextResponse.json({ success: false, results: [] });
  }
}
