import { NextRequest, NextResponse } from 'next/server';

// ⚡ Edge Runtime (Fastest Response)
export const runtime = 'edge';

const BASE_HOST = "https://gamerxyt.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // Input: Wo URL jo NCloud API ne banaya tha
  // Ex: https://gamerxyt.com/hubcloud.php?host=hubcloud&id=...&token=...
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: "No target URL provided" }, { status: 400 });
  }

  try {
    console.log("[GEN API] Step 2 Scraping Started for:", targetUrl);

    // -----------------------------------------------------------
    // 🕵️‍♂️ PHASE 1: Verify & Get "Tokenized" URL (Redirect Check)
    // -----------------------------------------------------------
    // GamerXYT ka pehla link aksar ek intermediate page hota hai.
    // Humein HTML ke andar se 'verified' link dhoondna hai.
    
    const step2Url = await fetchAndFindTokenizedUrl(targetUrl);
    
    if (!step2Url) {
        // Agar link nahi mila, matlab token expire ho gaya ya page change ho gaya
        throw new Error("Failed to find verified redirection URL (Step 2 Failed)");
    }

    console.log("[GEN API] Found Verified URL:", step2Url);

    // -----------------------------------------------------------
    // 🕵️‍♂️ PHASE 2: Scrape Final Direct Link
    // -----------------------------------------------------------
    // Ab us verified URL ko visit karke final 'Download/Play' button dhundenge.
    
    const finalData = await extractFinalLink(step2Url);

    // -----------------------------------------------------------
    // ✅ SUCCESS
    // -----------------------------------------------------------
    return NextResponse.json({
        success: true,
        step: 'gen_complete',
        streamLink: finalData.streamLink, // Ye raha asli maal (Direct Link)
        filename: finalData.filename,
        serverName: "G-Direct Fast",
        originalUrl: targetUrl
    });

  } catch (e: any) {
    console.error("[GEN API Error]:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ==========================================
// 🛠️ HELPER FUNCTIONS (The Core Logic)
// ==========================================

// Helper 1: HTML ke andar se Next Step ka URL dhoondna
async function fetchAndFindTokenizedUrl(url: string) {
    try {
        const res = await fetch(url, {
            headers: { 
                // Browser Headers bohot zaroori hain taaki GamerXYT block na kare
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://vcloud.zip/', // Referer Trick
            }
        });
        const html = await res.text();

        // 🔍 Regex Strategy:
        // Hum "hubcloud.php?" wala pattern dhundenge jo page mein kahin bhi ho.
        // Ye Relative (hubcloud.php?...) ya Absolute (https://gamerxyt...) dono pakad lega.
        
        const regex = /(?:https:\/\/gamerxyt\.com\/)?hubcloud\.php\?[^"']+/g;
        const matches = html.match(regex);

        if (matches) {
            // Logic: Sabse lamba URL usually sahi hota hai (usme extra tokens hote hain)
            let bestMatch = matches.reduce((a, b) => a.length > b.length ? a : b);
            
            // Fix Relative URLs (Agar http se shuru nahi ho raha)
            if (!bestMatch.startsWith('http')) {
                const separator = bestMatch.startsWith('/') ? '' : '/';
                bestMatch = `${BASE_HOST}${separator}${bestMatch}`;
            }
            return bestMatch;
        }
        
        return null;

    } catch (e) {
        console.error("Step 1 Fetch Error:", e);
        return null;
    }
}

// Helper 2: Final Page se Button Extract karna
async function extractFinalLink(url: string) {
    const res = await fetch(url, {
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://gamerxyt.com/' // Internal Referer
        }
    });
    const html = await res.text();

    // 1. Filename Extraction (Title tag se)
    let filename = "Unknown File";
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (titleMatch) {
        // Cleaning title (removing site branding)
        filename = titleMatch[1]
            .replace("(Movies4u.Foo)", "")
            .replace("- GamerXYT", "")
            .trim();
    }

    let streamLink = null;
    
    // 2. Button Link Extraction 🎯
    // GamerXYT links usually 'btn-success', 'btn-danger' class wale buttons mein hote hain.
    
    // Strategy A: Class based search (Most Reliable)
    const linkMatch = html.match(/href=["'](https?:\/\/[^"']+)["'][^>]*class=["'][^"']*btn-(?:success|danger|primary|warning)[^"']*["']/);
    
    if (linkMatch) {
        streamLink = linkMatch[1];
    } else {
        // Strategy B: Raw URL search (Fallback)
        // Dhoondo: google drive, hubcloud.run, ya workers.dev links seedhe HTML mein
        const rawMatch = html.match(/href=["'](https?:\/\/(?:drive\.google\.com|hubcloud\.run|workers\.dev|cf-worker)[^"']+)["']/);
        if (rawMatch) streamLink = rawMatch[1];
    }

    if (!streamLink) {
        throw new Error("Final Stream Link not found in the page source.");
    }

    return { streamLink, filename };
}
