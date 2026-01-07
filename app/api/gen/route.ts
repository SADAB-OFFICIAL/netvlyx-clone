import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const BASE_HOST = "https://gamerxyt.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: "No target URL provided" }, { status: 400 });

  try {
    // 1. Verify & Get Tokenized URL
    const step2Url = await fetchAndFindTokenizedUrl(targetUrl);
    
    if (!step2Url) {
        throw new Error("Failed to find verified redirection URL");
    }

    // 2. Scrape ALL Final Links (Multi-Server)
    const finalData = await extractAllLinks(step2Url);

    // 3. Smart Filtering (Junk Hatao)
    const cleanStreams = finalData.streams.filter(s => {
        const link = s.link.toLowerCase();
        const server = s.server.toLowerCase();
        
        // 🚫 Block Junk
        if (link.includes('dgdrive') || server.includes('dgdrive')) return false;
        if (link.includes('plough') || link.includes('terra')) return false;
        if (link.includes('login') || link.includes('signup')) return false;

        return true;
    });

    // 4. Return List
    return NextResponse.json({
        success: true,
        streamLink: cleanStreams[0]?.link, // Compatibility ke liye pehla link
        streams: cleanStreams,             // Ye hai naya maal (All Servers)
        filename: finalData.filename,
        originalUrl: targetUrl
    });

  } catch (e: any) {
    console.error("[GEN API Error]:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ==========================================
// 🛠️ HELPER FUNCTIONS
// ==========================================

async function fetchAndFindTokenizedUrl(url: string) {
    try {
        const res = await fetch(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://vcloud.zip/',
            }
        });
        const html = await res.text();
        const regex = /(?:https:\/\/gamerxyt\.com\/)?hubcloud\.php\?[^"']+/g;
        const matches = html.match(regex);

        if (matches) {
            let bestMatch = matches.reduce((a, b) => a.length > b.length ? a : b);
            if (!bestMatch.startsWith('http')) {
                const separator = bestMatch.startsWith('/') ? '' : '/';
                bestMatch = `${BASE_HOST}${separator}${bestMatch}`;
            }
            return bestMatch;
        }
        return null;
    } catch (e) { return null; }
}

async function extractAllLinks(url: string) {
    const res = await fetch(url, {
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://gamerxyt.com/'
        }
    });
    const html = await res.text();

    let filename = "Unknown File";
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (titleMatch) {
        filename = titleMatch[1]
            .replace("(Movies4u.Foo)", "")
            .replace("- GamerXYT", "")
            .trim();
    }

    const streams: { server: string, link: string, type: string }[] = [];
    
    // 🎯 STRATEGY: Find all buttons with links
    // Regex matches: <a href="..." class="... btn-success ...">Download Text</a>
    
    // 1. Success Buttons (Usually FSL / Fast)
    const successRegex = /<a[^>]+href=["']([^"']+)["'][^>]*class=["'][^"']*btn-success[^"']*["'][^>]*>(.*?)<\/a>/g;
    let match;
    while ((match = successRegex.exec(html)) !== null) {
        streams.push({
            server: "⚡ Fast Cloud (VIP)",
            link: match[1],
            type: "DIRECT"
        });
    }

    // 2. Danger Buttons (Usually G-Direct / Drive)
    const dangerRegex = /<a[^>]+href=["']([^"']+)["'][^>]*class=["'][^"']*btn-danger[^"']*["'][^>]*>(.*?)<\/a>/g;
    while ((match = dangerRegex.exec(html)) !== null) {
        streams.push({
            server: "🚀 G-Direct (10Gbps)",
            link: match[1],
            type: "DRIVE"
        });
    }

    // 3. Warning/Primary Buttons (Other Mirrors)
    const otherRegex = /<a[^>]+href=["']([^"']+)["'][^>]*class=["'][^"']*btn-(?:primary|warning|info)[^"']*["'][^>]*>(.*?)<\/a>/g;
    while ((match = otherRegex.exec(html)) !== null) {
        // Clean Link Name
        let name = match[2].replace(/<[^>]*>/g, '').trim(); // Remove inner HTML tags
        if (name.toLowerCase().includes('download')) name = "Cloud Mirror";
        
        streams.push({
            server: name || "Backup Server",
            link: match[1],
            type: "MIRROR"
        });
    }

    // 4. Fallback: If no buttons found, find raw links
    if (streams.length === 0) {
        const rawMatch = html.match(/href=["'](https?:\/\/(?:drive\.google\.com|hubcloud\.run|workers\.dev|cf-worker|cdn\.fsl)[^"']+)["']/);
        if (rawMatch) {
            streams.push({
                server: "⚡ Fast Cloud (Fallback)",
                link: rawMatch[1],
                type: "DIRECT"
            });
        }
    }

    if (streams.length === 0) throw new Error("No stream links found on page");

    return { streams, filename };
}
