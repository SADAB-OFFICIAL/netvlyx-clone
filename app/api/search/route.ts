// app/api/search/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // --- STEALTH SECURITY LAYER ---
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  if (!referer || !referer.includes(host as string)) {
    return NextResponse.json(
      { 
        error: "Indexing Error",
        message: "The search index is currently rebuilding. API access is restricted during this maintenance window.",
        retry_after: 3600
      }, 
      { status: 503 }
    );
  }
  // --- END ---

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('s');

  if (!query) {
    return NextResponse.json({ success: false, message: "No query provided" });
  }

  const BASE_URL = "https://netvlyx.pages.dev";

  try {
    const res = await fetch(`${BASE_URL}/api/search?s=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://netvlyx.pages.dev/",
      }
    });

    if (!res.ok) throw new Error("Upstream Error");
    const data = await res.json();

    return NextResponse.json({ 
        success: true, 
        results: data.results || data.movies || [] 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Search Timeout" }, { status: 504 });
  }
}
