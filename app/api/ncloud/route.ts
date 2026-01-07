import { NextRequest, NextResponse } from 'next/server';

// ⚡ Edge Runtime for Speed
export const runtime = 'edge';

// 🔒 Constants (Tumhare diye huye)
const TOKEN_SOURCE = "https://vcloud.zip/hr17ehaeym7rza9";
const PROXY = "https://proxy.vlyx.workers.dev";
const BASE_URL = "https://gamerxyt.com/hubcloud.php";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key'); // Encoded HubCloud URL

  if (!key) return NextResponse.json({ error: "No key provided" }, { status: 400 });

  try {
    // 1. Decode Key safely
    let cleanKey = key.replace(/-/g, '+').replace(/_/g, '/');
    while (cleanKey.length % 4) cleanKey += '=';
    
    const decoded = atob(cleanKey);
    const json = JSON.parse(decoded);
    const hubCloudUrl = json.url || json.link;

    if (!hubCloudUrl) throw new Error("URL missing in key");

    // 2. Extract HubCloud ID
    // Logic: URL ke last part ko ID maante hain
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

    // 5. Success Response
    // Frontend is URL ko lekar 'gen' API ko call karega
    return NextResponse.json({
        success: true,
        step: 'ncloud_complete',
        hubId: id,
        vToken: token,
        finalUrl: finalUrl // <-- Ye wo URL hai jo humein chahiye
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
        // Proxy use karke V-Cloud ka source code uthao
        const res = await fetch(`${PROXY}/?url=${encodeURIComponent(TOKEN_SOURCE)}`, {
            cache: 'no-store',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        if (!res.ok) return null;

        const html = await res.text();

        // Regex to find token
        // Pattern: token=OW1RR3dleTJzdDds... (until next & or end)
        // Hum simple approach use karenge jo tumhare snippet se match kare
        const match = html.match(/token=([^&"'\s]+)/);
        
        return match ? match[1] : null;

    } catch (e) {
        console.error("Token Fetch Error:", e);
        return null;
    }
}
