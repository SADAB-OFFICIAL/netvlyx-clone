import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const TOKEN_SOURCE = "https://vcloud.zip/hr17ehaeym7rza9";
const PROXY = "https://proxy.vlyx.workers.dev";
const BASE_URL = "https://gamerxyt.com/hubcloud.php";

// Old API ko Backup ke liye rakhte hain (Optional)
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

    // 2. Identify Host & ID
    const urlObj = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    const pathParts = urlObj.pathname.replace(/\/$/, '').split('/');
    const id = pathParts.pop(); 

    if (!id) throw new Error("Invalid ID extracted");

    // 🧠 SMART HOST DETECTION
    // Agar link me 'hubcloud' ya 'hubdrive' hai -> host=hubcloud
    // Nahi to -> host=vcloud (Default for vcloud.zip etc)
    const isHubCloud = targetUrl.includes('hubcloud') || targetUrl.includes('hubdrive');
    const hostParam = isHubCloud ? 'hubcloud' : 'vcloud';

    console.log(`[N-Cloud] Processing: ${targetUrl} | Host: ${hostParam} | ID: ${id}`);

    // 3. Get Token (Universal Method)
    const token = await getVCloudToken();
    if (!token) throw new Error("Failed to extract Token");

    // 4. Construct Final GamerXYT URL
    // Ye fresh link generate karega (No 404 Error)
    const finalUrl = `${BASE_URL}?host=${hostParam}&id=${id}&token=${token}`;

    return NextResponse.json({
        success: true,
        mode: 'handshake', // Frontend ko bolo Step 2 (Gen) chalaye
        finalUrl: finalUrl
    });

  } catch (e: any) {
    console.error("[N-Cloud API Error]:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Helper: Token Scraper
async function getVCloudToken() {
    try {
        const res = await fetch(`${PROXY}/?url=${encodeURIComponent(TOKEN_SOURCE)}`, {
            cache: 'no-store',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (!res.ok) return null;
        const html = await res.text();
        const match = html.match(/token=([^&"'\s]+)/);
        return match ? match[1] : null;
    } catch (e) { return null; }
}
