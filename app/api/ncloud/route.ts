import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const TOKEN_SOURCE = "https://vcloud.zip/hr17ehaeym7rza9";
const PROXY = "https://proxy.vlyx.workers.dev";
const BASE_URL = "https://gamerxyt.com/hubcloud.php";
const OLD_API = "https://nothing-to-see-nine.vercel.app/hubcloud"; // V-Cloud ke liye

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) return NextResponse.json({ error: "No key provided" }, { status: 400 });

  try {
    // 1. Decode Key safely
    let cleanKey = key.replace(/-/g, '+').replace(/_/g, '/');
    while (cleanKey.length % 4) cleanKey += '=';
    
    const decoded = atob(cleanKey);
    const json = JSON.parse(decoded);
    const targetUrl = json.url || json.link;

    if (!targetUrl) throw new Error("URL missing in key");

    // -----------------------------------------------------------
    // 🧠 SMART SWITCH: Check if HubCloud or V-Cloud
    // -----------------------------------------------------------
    const isHubCloud = targetUrl.includes('hubcloud') || targetUrl.includes('hubdrive');

    if (!isHubCloud) {
        // ==========================================
        // 🔵 CASE A: V-CLOUD (Use Old API Proxy)
        // ==========================================
        // Kyunki V-Cloud links token system se nahi chalte
        
        const apiUrl = `${OLD_API}?url=${encodeURIComponent(targetUrl)}&key=sadabefy`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        
        // Agar Old API ne streams de diye, to seedha return karo
        return NextResponse.json({
            success: true,
            mode: 'direct', // Frontend ko batao: "Kaam ho gaya, ye lo streams"
            streams: data.streams || [],
            title: data.title
        });
    }

    // ==========================================
    // 🔴 CASE B: HUBCLOUD (Use Token Logic)
    // ==========================================
    
    // 1. ID Extraction
    const urlObj = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    const pathParts = urlObj.pathname.replace(/\/$/, '').split('/');
    const id = pathParts.pop(); 

    if (!id) throw new Error("Invalid HubCloud ID");

    // 2. Token Extraction
    const token = await getVCloudToken();
    if (!token) throw new Error("Failed to extract V-Cloud Token");

    // 3. Construct Final GamerXYT URL
    const finalUrl = `${BASE_URL}?host=hubcloud&id=${id}&token=${token}`;

    return NextResponse.json({
        success: true,
        mode: 'handshake', // Frontend ko batao: "Abhi Step 2 (Gen Scraper) baaki hai"
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
