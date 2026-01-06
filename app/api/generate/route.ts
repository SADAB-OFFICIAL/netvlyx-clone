import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const TOKEN_SOURCE = "https://vcloud.zip/hr17ehaeym7rza9";
const PROXY = "https://proxy.vlyx.workers.dev";
const BASE_HOST = "https://gamerxyt.com";
const BASE_SCRIPT = "hubcloud.php";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) return NextResponse.json({ error: "No key provided" }, { status: 400 });

  try {
    // 🛠️ 1. Secure Key Decoding
    let cleanKey = key.replace(/-/g, '+').replace(/_/g, '/');
    while (cleanKey.length % 4) cleanKey += '='; // Padding fix

    const decoded = atob(cleanKey);
    const json = JSON.parse(decoded);
    const inputUrl = json.url || json.link;

    if (!inputUrl) throw new Error("URL missing in key data");

    // 🛠️ 2. ID Extraction
    const urlObj = new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`);
    const pathParts = urlObj.pathname.replace(/\/$/, '').split('/');
    const id = pathParts.pop(); 

    if (!id) throw new Error("Invalid HubCloud ID");

    // --- 🕵️‍♂️ STEP 1: Get Initial Token ---
    const token = await getVcloudToken();
    if (!token) throw new Error("Failed to get vCloud token");

    // Construct URL 1
    const step1Url = `${BASE_HOST}/${BASE_SCRIPT}?host=hubcloud&id=${id}&token=${token}`;
    
    // --- 🕵️‍♂️ STEP 2: Fetch & Find Tokenized URL (The Error Fix) ---
    // Yahan hum relative aur absolute dono URLs check karenge
    const step2Url = await fetchAndFindTokenizedUrl(step1Url);
    
    if (!step2Url) {
        // Debugging ke liye step 1 ka URL return kar rahe hain taaki pata chale kahan atka
        throw new Error(`Failed to verify token (Step 2). Source: ${step1Url}`);
    }

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
        const res = await fetch(`${PROXY}/?url=${encodeURIComponent(TOKEN_SOURCE)}`, { 
            cache: 'no-store',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const text = await res.text();
        const match = text.match(/token=([^&']+)/);
        return match ? match[1] : null;
    } catch (e) { return null; }
}

async function fetchAndFindTokenizedUrl(url: string) {
    try {
        const res = await fetch(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://vcloud.zip/' // Adding Referer helps bypass checks
            }
        });
        const html = await res.text();

        // Regex Strategies to find the next link:
        // 1. Absolute: https://gamerxyt.com/hubcloud.php?host=...
        // 2. Relative: hubcloud.php?host=...
        
        // Search for 'hubcloud.php' followed by query params
        const regex = /(?:https:\/\/gamerxyt\.com\/)?hubcloud\.php\?[^"']+/g;
        const matches = html.match(regex);

        if (matches) {
            // Find the longest match (it usually contains the extra token/page params)
            let bestMatch = matches.reduce((a, b) => a.length > b.length ? a : b);
            
            // Agar relative hai, to domain add kar do
            if (!bestMatch.startsWith('http')) {
                bestMatch = `${BASE_HOST}/${bestMatch}`;
            }
            return bestMatch;
        }
        
        return null;
    } catch (e) {
        console.error("Step 2 Error:", e);
        return null;
    }
}

async function extractFinalLink(url: string) {
    const res = await fetch(url, {
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://gamerxyt.com/'
        }
    });
    const html = await res.text();

    let filename = "Unknown Movie";
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (titleMatch) filename = titleMatch[1].replace("(Movies4u.Foo)", "").trim();

    let streamLink = null;
    
    // 1. Try finding 'btn-success' / 'btn-danger' (Direct Link Button)
    const linkMatch = html.match(/href=["'](https?:\/\/[^"']+)["'][^>]*class=["'][^"']*btn-(?:success|danger|primary)[^"']*["']/);
    
    if (linkMatch) {
        streamLink = linkMatch[1];
    } else {
        // 2. Fallback: Search for known drive domains
        const rawMatch = html.match(/href=["'](https?:\/\/(?:drive\.google\.com|hubcloud\.run|workers\.dev|cf-worker)[^"']+)["']/);
        if (rawMatch) streamLink = rawMatch[1];
    }

    if (!streamLink) throw new Error("Stream Link Extraction Failed");

    return { streamLink, filename };
}
