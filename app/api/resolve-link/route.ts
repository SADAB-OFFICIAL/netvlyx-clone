// app/api/resolve-link/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    const response = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow' 
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    // Humara maqsad hai HubCloud ya V-Cloud ka link dhundna
    let resolvedUrl = '';
    
    // Strategy 1: Saare links check karo
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        if (href.includes('hubcloud') || href.includes('vcloud') || href.includes('drive') || href.includes('gdflix')) {
          resolvedUrl = href;
          return false; // Loop break
        }
      }
    });

    // Strategy 2: Agar seedha link nahi mila, to shayad "Fast Server" button ho
    if (!resolvedUrl) {
      resolvedUrl = $('.maxbutton-fast-server').attr('href') || '';
    }

    if (resolvedUrl) {
      return NextResponse.json({ success: true, url: resolvedUrl });
    } else {
      return NextResponse.json({ success: false, error: "Cloud link not found" });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Resolution Failed' });
  }
}
