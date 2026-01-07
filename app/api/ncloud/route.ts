import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// --- CONFIGURATION ---
// Ek strong V-Cloud source jisme hamesha valid token hota hai
const TOKEN_SOURCE = "https://vcloud.zip/hr17ehaeym7rza9";
const PROXY = "https://proxy.vlyx.workers.dev";
const BASE_URL = "https://gamerxyt.com/hubcloud.php";
const OLD_API = "https://nothing-to-see-nine.vercel.app/hubcloud"; 

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) return NextResponse.json({ error: "No key provided" }, { status: 400 });

  try {
    // 1. Decode Key
    let cleanKey = key.replace(/-/g, '+').replace(/_/g, '/');
    while (cleanKey.length % 4) cleanKey += '=';
    
    const decoded = atob(cleanKey);
    const json = JSON.parse(decoded);
    const targetUrl = json.url || json.link;

    if (!targetUrl) throw new Error("URL missing in key");

    // -----------------------------------------------------------
    // 🧠 LOGIC: Check Link Type
    // -----------------------------------------------------------
    const isHubCloud = targetUrl.includes('hubcloud') || targetUrl.includes('hubdrive');

    // === V-CLOUD / OTHER LINKS ===
    if (!isHubCloud) {
        // Old API Proxy Logic (Direct Streams)
        const apiUrl = `${OLD_API}?url=${encodeURIComponent(targetUrl)}&key=sadabefy`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        
        return NextResponse.json({
            success: true,
            mode: 'direct',
            streams: data.streams || [],
            title: data.title
        });
    }

    // === HUBCLOUD (STRONG TOKEN SYSTEM) ===
    console.log(`[N-Cloud] Generatng Fresh Token for: ${targetUrl}`);

    // 1. ID Extraction (Robust)
    const urlObj = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    const pathParts = urlObj.pathname.replace(/\/$/, '').split('/');
    const id = pathParts.pop(); 

    if (!id) throw new Error("Invalid HubCloud ID");

    // 2. Token Extraction (FORCE FRESH) ⚡
    const token = await getFreshToken();
    
    if (!token) {
        throw new Error("Failed to generate fresh token. Source might be protected.");
    }

    // 3. Construct URL
    const finalUrl = `${BASE_URL}?host=hubcloud&id=${id}&token=${token}`;

    return NextResponse.json({
        success: true,
        mode: 'handshake',
        finalUrl: finalUrl
    });

  } catch (e: any) {
    console.error("[N-Cloud API Error]:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ==========================================
// 🛠️ HELPER: Bulletproof Token Extractor
// ==========================================
async function getFreshToken() {
    try {
        // 🔥 TRICK: Add Random Timestamp to bypass Cloudflare/Proxy Cache
        const timestamp = Date.now();
        const freshUrl = `${TOKEN_SOURCE}?t=${timestamp}`; 
        
        // Proxy call with Cache-Busting headers
        const res = await fetch(`${PROXY}/?url=${encodeURIComponent(freshUrl)}`, {
            cache: 'no-store', // Force Network Request
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!res.ok) return null;

        const html = await res.text();

        // 🔍 STRONG REGEX: Ye pattern token ko har haal mein dhoond lega
        // Pattern: token=KUCH_BHI_CHARACTER_JAB_TAK_&_YA_' _NA_AAYE
        const match = html.match(/token=([^&"'\s<>]+)/);
        
        if (match && match[1]) {
            console.log("✅ Token Extracted:", match[1].substring(0, 10) + "...");
            return match[1];
        }
        
        return null;

    } catch (e) {
        console.error("Token Extraction Failed:", e);
        return null;
    }
}
