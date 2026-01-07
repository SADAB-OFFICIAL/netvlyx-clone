import { NextRequest, NextResponse } from 'next/server';

// ⚡ Edge Runtime (Fast Execution)
export const runtime = 'edge';

// 🔒 Constants
const TOKEN_SOURCE = "https://vcloud.zip/hr17ehaeym7rza9";
const PROXY = "https://proxy.vlyx.workers.dev";
const BASE_URL = "https://gamerxyt.com/hubcloud.php";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key'); // Encoded HubCloud URL

  if (!key) return NextResponse.json({ error: "No key provided" }, { status: 400 });

  try {
    // 1. Decode Key (Safe Replace)
    let cleanKey = key.replace(/-/g, '+').replace(/_/g, '/');
    while (cleanKey.length % 4) cleanKey += '=';
    
    const decoded = atob(cleanKey);
    const json = JSON.parse(decoded);
    // URL kahi 'url' key mein hota hai kahi 'link' mein
    const hubCloudUrl = json.url || json.link;

    if (!hubCloudUrl) throw new Error("URL missing in key");

    // 2. Extract HubCloud ID
    // Ex: https://hubcloud.foo/drive/azipjklbznz1ijp -> ID: azipjklbznz1ijp
    const urlObj = new URL(hubCloudUrl.startsWith('http') ? hubCloudUrl : `https://${hubCloudUrl}`);
    const pathParts = urlObj.pathname.replace(/\/$/, '').split('/');
    const id = pathParts.pop(); 

    if (!id) throw new Error("Invalid HubCloud ID");

    // 3. Extract Token from V-Cloud (Using Proxy)
    const token = await getVCloudToken();
    
    if (!token) throw new Error("Failed to extract V-Cloud Token");

    // 4. Construct the Final GamerXYT URL 🛠️
    // Format: host=hubcloud & id={HUB_ID} & token={V_TOKEN}
    const finalUrl = `${BASE_URL}?host=hubcloud&id=${id}&token=${token}`;

    console.log("Generated Magic URL:", finalUrl);

    // 5. Return JSON (Taaki VlyxDrive isse leke Gen ke paas jaye)
    return NextResponse.json({
        success: true,
        finalUrl: finalUrl
    });

  } catch (e: any) {
    console.error("[N-Cloud API Error]:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ==========================================
// 🛠️ HELPER: Token Scraper
// ==========================================
async function getVCloudToken() {
    try {
        const res = await fetch(`${PROXY}/?url=${encodeURIComponent(TOKEN_SOURCE)}`, {
            cache: 'no-store',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        if (!res.ok) return null;

        const html = await res.text();

        // Regex to find token (Correct Pattern)
        // Token '=' se start nahi hota, 'token=' ke baad aata hai
        const match = html.match(/token=([^&"'\s]+)/);
        
        return match ? match[1] : null;

    } catch (e) {
        console.error("Token Fetch Error:", e);
        return null;
    }
}
