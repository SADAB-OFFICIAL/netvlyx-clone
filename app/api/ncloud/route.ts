import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// --- CONFIGURATION ---
const TOKEN_SOURCE = "https://vcloud.zip/hr17ehaeym7rza9";
const PROXY = "https://proxy.vlyx.workers.dev";
const BASE_URL = "https://gamerxyt.com/hubcloud.php";
const OLD_API = "https://nothing-to-see-nine.vercel.app/hubcloud"; // V-Cloud ke liye API

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (!key) return NextResponse.json({ error: "No key provided" }, { status: 400 });

  try {
    // -----------------------------------------------------------
    // 1. DECODE KEY (Safe Logic)
    // -----------------------------------------------------------
    let cleanKey = key.replace(/-/g, '+').replace(/_/g, '/');
    while (cleanKey.length % 4) cleanKey += '='; // Padding fix
    
    const decoded = atob(cleanKey);
    const json = JSON.parse(decoded);
    const targetUrl = json.url || json.link;

    if (!targetUrl) throw new Error("URL missing in key");

    // -----------------------------------------------------------
    // 🧠 SMART SWITCH: HubCloud vs V-Cloud
    // -----------------------------------------------------------
    // Agar link me 'hubcloud' ya 'hubdrive' nahi hai, to wo V-Cloud hai
    const isHubCloud = targetUrl.includes('hubcloud') || targetUrl.includes('hubdrive');

    if (!isHubCloud) {
        // ======================================================
        // 🔵 CASE A: V-CLOUD (Old API Proxy + Smart Filter)
        // ======================================================
        console.log(`[N-Cloud] V-Cloud Mode Detected: ${targetUrl}`);
        
        const apiUrl = `${OLD_API}?url=${encodeURIComponent(targetUrl)}&key=sadabefy`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        
        let rawStreams = data.streams || [];
        
        // 🧹 JUNK FILTER LOGIC (DgDrive, Login pages hatao)
        const cleanStreams = rawStreams.filter((s: any) => {
            const link = (s.link || '').toLowerCase();
            const server = (s.server || '').toLowerCase();
            
            // 🚫 Block List
            if (link.includes('dgdrive') || server.includes('dgdrive')) return false;
            if (link.includes('plough') || link.includes('terra')) return false;
            if (link.includes('login') || link.includes('signup')) return false;
            if (link.includes('pub-') && !link.includes('r2.dev')) return false; // Random Junk
            
            return true; // Baaki sab (FSL, Google, 10Gbps) pass
        });

        // ⭐ PRIORITY SORT (10Gbps/FSL Top pe)
        cleanStreams.sort((a: any, b: any) => {
            const priority = ['10gbps', 'fsl', 'fast', 'google', 'cloud'];
            const getPriority = (str: string) => {
                const index = priority.findIndex(p => str.toLowerCase().includes(p));
                return index === -1 ? 99 : index;
            };
            return getPriority(a.server) - getPriority(b.server);
        });
        
        return NextResponse.json({
            success: true,
            mode: 'direct', // Frontend ko signal: "Kaam ho gaya, streams dikhao"
            streams: cleanStreams,
            title: data.title
        });
    }

    // ======================================================
    // 🔴 CASE B: HUBCLOUD (Token + GamerXYT Logic)
    // ======================================================
    console.log(`[N-Cloud] HubCloud Mode Detected: ${targetUrl}`);

    // 1. ID Extraction
    const urlObj = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    const pathParts = urlObj.pathname.replace(/\/$/, '').split('/');
    const id = pathParts.pop(); 

    if (!id) throw new Error("Invalid HubCloud ID");

    // 2. Token Extraction
    const token = await getVCloudToken();
    if (!token) throw new Error("Failed to extract V-Cloud Token");

    // 3. Construct Final URL
    const finalUrl = `${BASE_URL}?host=hubcloud&id=${id}&token=${token}`;

    return NextResponse.json({
        success: true,
        mode: 'handshake', // Frontend ko signal: "Step 2 (Gen Scraper) chalao"
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            }
        });
        
        if (!res.ok) return null;

        const html = await res.text();
        // Token Regex
        const match = html.match(/token=([^&"'\s]+)/);
        
        return match ? match[1] : null;

    } catch (e) {
        console.error("Token Fetch Failed:", e);
        return null;
    }
}
