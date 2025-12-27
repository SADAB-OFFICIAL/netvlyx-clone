// app/api/resolve-link/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // Direct Call to NetVlyx API
    // Hum encodeURIComponent use kar rahe hain taaki link safe rahe
    const apiUrl = `https://netvlyx.pages.dev/api/m4ulinks-scraper?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error("Failed to fetch from NetVlyx API");

    const data = await response.json();
    
    // API Response ko humare frontend ke format mein bhej do
    return NextResponse.json({ success: true, data: data });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: 'Failed to resolve link via API' });
  }
}
