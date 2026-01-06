import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const TOKEN_SOURCE = "https://vcloud.zip/hr17ehaeym7rza9";
const PROXY = "https://proxy.vlyx.workers.dev";
const BASE_HOST = "https://gamerxyt.com/hubcloud.php";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) return NextResponse.json({ error: "No key provided" }, { status: 400 });

  try {
    // 🛠️ FIX: URL-Safe Base64 ko Standard Base64 mein badlo
    let cleanKey = key.replace(/-/g, '+').replace(/_/g, '/');
    
    // Padding wapas lagao agar missing hai (atob ko padding chahiye hoti hai)
    while (cleanKey.length % 4) {
        cleanKey += '=';
    }

    // Ab Decode karo
    const decoded = atob(cleanKey);
    const json = JSON.parse(decoded);
    const inputUrl = json.url || json.link; // Kabhi 'url' hota hai, kabhi 'link'

    if (!inputUrl) throw new Error("URL missing in key data");

    // 2. ID Extraction Logic
    const urlObj = new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`);
    // ID nikalne ka robust tareeka (Last path segment)
    const pathParts = urlObj.pathname.replace(/\/$/, '').split('/');
    const id = pathParts.pop(); 

    if (!id) throw new Error("Invalid HubCloud ID");

    console.log(`[Generate API] Processing ID: ${id}`);

    // --- 🕵️‍♂️ STEP 1: Get Initial Token ---
    const token = await getVcloudToken();
    if (!token) throw new Error("Failed to get vCloud token");

    // Construct First URL
    const step1Url = `${BASE_HOST}?host=hubcloud&id=${id}&token=${token}`;
    
    // --- 🕵️‍♂️ STEP 2: Fetch Tokenized URL ---
    const step2Url = await fetchAndFindTokenizedUrl(step1Url);
    if (!step2Url) throw new Error("Failed to verify token (Step 2)");

    // --- 🕵️‍♂️ STEP 3: Fetch Final Stream Link ---
    const finalData = await extractFinalLink(step2Url);
    
    return NextResponse.json({
        success: true,
        streamUrl: finalData.streamLink,
        filename: finalData.filename,
        originalUrl: inputUrl
    });

  } catch (e: any) {
    console.error("[Generate API Error]:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ==========================================
// 🛠️ HELPER FUNCTIONS
// ==========================================

async function getVcloudToken() {
    try {
        const res = await fetch(`${PROXY}/?url=${encodeURIComponent(TOKEN_SOURCE)}`, { cache: 'no-store' });
        const text = await res.text();
        const match = text.match(/token=([^&']+)/);
        return match ? match[1] : null;
    } catch (e) { return null; }
}

async function fetchAndFindTokenizedUrl(url: string) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await res.text();

    // Debugging ke liye: GamerXYT ke redirect pattern ko pakadna
    // Pattern: meta refresh ya window.location ya anchor tag
    const regex = /https:\/\/gamerxyt\.com\/hubcloud\.php\?[^"']+/g;
    const matches = html.match(regex);

    if (matches) {
        // Sabse lamba link usually sahi hota hai (usme naya token hota hai)
        return matches.reduce((a, b) => a.length > b.length ? a : b);
    }
    return null;
}

async function extractFinalLink(url: string) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();

    let filename = "Unknown Movie";
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (titleMatch) filename = titleMatch[1].replace("(Movies4u.Foo)", "").trim();

    let streamLink = null;
    
    // 1. Try finding 'btn-success' / 'btn-danger' (GamerXYT Style)
    const linkMatch = html.match(/href=["'](https?:\/\/[^"']+)["'][^>]*class=["'][^"']*btn-(?:success|danger|primary)[^"']*["']/);
    
    if (linkMatch) {
        streamLink = linkMatch[1];
    } else {
        // 2. Fallback: Search for drive/hubcloud links directly
        const rawMatch = html.match(/href=["'](https?:\/\/(?:drive\.google\.com|hubcloud\.run|workers\.dev)[^"']+)["']/);
        if (rawMatch) streamLink = rawMatch[1];
    }

    if (!streamLink) throw new Error("Stream Link Extraction Failed");

    return { streamLink, filename };
}
