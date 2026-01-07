import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const TOKEN_SOURCE = "https://vcloud.zip/hr17ehaeym7rza9";
const PROXY = "https://proxy.vlyx.workers.dev";
const BASE_URL = "https://gamerxyt.com/hubcloud.php";
const OLD_API = "https://nothing-to-see-nine.vercel.app/hubcloud"; // V-Cloud Source

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
    // 🧠 SMART SWITCH: HubCloud vs V-Cloud
    // -----------------------------------------------------------
    const isHubCloud = targetUrl.includes('hubcloud') || targetUrl.includes('hubdrive');

    if (!isHubCloud) {
        // ==========================================
        // 🔵 CASE A: V-CLOUD (Old API + Filter)
        // ==========================================
        const apiUrl = `${OLD_API}?url=${encodeURIComponent(targetUrl)}&key=sadabefy`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        
        let rawStreams = data.streams || [];
        
        // 🧹 JUNK FILTER (DgDrive, Login pages hatao)
        const cleanStreams = rawStreams.filter((s: any) => {
            const link = (s.link || '').toLowerCase();
            const server = (s.server || '').toLowerCase();
            
            if (link.includes('dgdrive') || server.includes('dgdrive')) return false;
            if (link.includes('plough') || link.includes('terra')) return false;
            if (link.includes('login') || link.includes('signup')) return false;
            
            return true;
        });

        // ⭐ Priority Sort (10Gbps/FSL Top)
        cleanStreams.sort((a: any, b: any) => {
            const priority = ['10gbps', 'fsl', 'google', 'cloud'];
            const getPriority = (str: string) => {
                const index = priority.findIndex(p => str.toLowerCase().includes(p));
                return index === -1 ? 99 : index;
            };
            return getPriority(a.server) - getPriority(b.server);
        });
        
        return NextResponse.json({
            success: true,
            mode: 'direct', // Frontend: "Seedha display karo"
            streams: cleanStreams,
            title: data.title
        });
    }

    // ==========================================
    // 🔴 CASE B: HUBCLOUD (Token Logic)
    // ==========================================
    const urlObj = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    const pathParts = urlObj.pathname.replace(/\/$/, '').split('/');
    const id = pathParts.pop(); 

    if (!id) throw new Error("Invalid HubCloud ID");

    const token = await getVCloudToken();
    if (!token) throw new Error("Failed to extract V-Cloud Token");

    const finalUrl = `${BASE_URL}?host=hubcloud&id=${id}&token=${token}`;

    return NextResponse.json({
        success: true,
        mode: 'handshake', // Frontend: "Abhi Step 2 baaki hai"
        finalUrl: finalUrl
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

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
