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
    // 1. Decode Key
    const decoded = atob(key);
    const json = JSON.parse(decoded);
    const inputUrl = json.url; 

    if (!inputUrl) throw new Error("URL missing in key");

    // 2. ID Extraction
    const urlObj = new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`);
    const pathParts = urlObj.pathname.replace(/\/$/, '').split('/');
    const id = pathParts.pop(); 

    if (!id) throw new Error("Invalid ID");

    // --- 🕵️‍♂️ STEP 1: Get Initial Token ---
    const token = await getVcloudToken();
    if (!token) throw new Error("Failed to get vCloud token");

    // Construct First URL (Log Step 1)
    const step1Url = `${BASE_HOST}?host=hubcloud&id=${id}&token=${token}`;
    console.log("[N-Cloud] Step 1 URL:", step1Url);

    // --- 🕵️‍♂️ STEP 2: Fetch Tokenized URL (Log Step 2) ---
    const step2Url = await fetchAndFindTokenizedUrl(step1Url);
    if (!step2Url) throw new Error("Failed to find Tokenized URL (Step 2)");
    console.log("[N-Cloud] Step 2 URL:", step2Url);

    // --- 🕵️‍♂️ STEP 3: Fetch Final Stream Link (Log Step 3) ---
    const finalData = await extractFinalLink(step2Url);
    
    // Return Final Direct Link (Streamable)
    return NextResponse.json({
        success: true,
        streamUrl: finalData.streamLink,
        filename: finalData.filename,
        originalUrl: inputUrl
    });

  } catch (e: any) {
    console.error("[N-Cloud Error]:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ==========================================
// 🛠️ HELPER FUNCTIONS (The Magic Logic)
// ==========================================

// 1. Token Scraper (Wahi Friend wala trick)
async function getVcloudToken() {
    try {
        const res = await fetch(`${PROXY}/?url=${encodeURIComponent(TOKEN_SOURCE)}`, { cache: 'no-store' });
        const text = await res.text();
        const match = text.match(/token=([^&']+)/);
        return match ? match[1] : null;
    } catch (e) { return null; }
}

// 2. Step 2 Handler: Finds "Tokenized URL" inside HTML/JS
async function fetchAndFindTokenizedUrl(url: string) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await res.text();

    // Debug logs ke hisaab se URL pattern dhoondna hai
    // Pattern: https://gamerxyt.com/hubcloud.php?host=hubcloud&id=...&token=...
    // Aksar ye window.location.replace("...") ya <a href="..."> mein hota hai
    
    const regex = /https:\/\/gamerxyt\.com\/hubcloud\.php\?[^"']+/g;
    const matches = html.match(regex);

    // Filter logic: Hame wo link chahiye jo input URL se thoda alag ho (redirect wala)
    if (matches) {
        // Find the longest match (usually contains extra params like &page= or &token=new)
        return matches.reduce((a, b) => a.length > b.length ? a : b);
    }
    return null;
}

// 3. Step 3 Handler: Extracts Final Direct Link (Google Drive / Worker)
async function extractFinalLink(url: string) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();

    // 1. Filename Extraction
    let filename = "Unknown Movie";
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (titleMatch) filename = titleMatch[1].replace("(Movies4u.Foo)", "").trim();

    // 2. Direct Link Extraction
    // GamerXYT usually returns a button with class 'btn-success' or 'btn-danger' containing the link
    // Pattern: <a href="https://hubcloud.run/..." class="btn">
    
    let streamLink = null;
    
    // Pattern A: Direct HubCloud/Drive link in anchor tag
    const linkMatch = html.match(/href=["'](https?:\/\/[^"']+)["'][^>]*class=["'][^"']*btn-(?:success|danger|primary)[^"']*["']/);
    
    if (linkMatch) {
        streamLink = linkMatch[1];
    } else {
        // Pattern B: Raw Search (Fallback) -> Finds Google Drive or HubCloud links
        const rawMatch = html.match(/href=["'](https?:\/\/(?:drive\.google\.com|hubcloud\.run|workers\.dev)[^"']+)["']/);
        if (rawMatch) streamLink = rawMatch[1];
    }

    if (!streamLink) throw new Error("Stream Link Extraction Failed");

    return { streamLink, filename };
}
