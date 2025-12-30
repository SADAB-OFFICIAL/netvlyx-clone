// app/api/ncloud/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // 1. Call the External API
    // Hum encodeURIComponent use nahi kar rahe kyunki API shayad raw url maangta ho, 
    // par safety ke liye check kar lein. Usually query params encode hone chahiye.
    const apiUrl = `https://nothing-to-see-nine.vercel.app/hubcloud?url=${url}&key=sadabefy`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error("External API Failed");

    const data = await response.json();

    if (!data.streams || !Array.isArray(data.streams)) {
        throw new Error("No streams found in API response");
    }

    // 2. CLEANING LOGIC (Sirf Kachra Hatao, Achhe Servers Nahi)
    const cleanStreams = data.streams.filter((stream: any) => {
        const link = stream.link || "";
        
        // A. Reject obvious junk (Broken Links)
        if (!link.startsWith("http")) return false; // Invalid URL
        if (link.includes("hubcloud.foo/drive")) return false; // Recursive link (Loop)
        if (link.endsWith("token=")) return false; // Empty token
        if (link.includes("icons8.com")) return false; // Fake image links
        
        return true; // Baaki sab aane do (10Gbps, Cloud Server, etc.)
    });

    // 3. SORTING LOGIC (Jo Best Hai Wo Top Par)
    // Priority: FSL > 10Gbps > Long Signed URLs > Others
    cleanStreams.sort((a: any, b: any) => {
        const serverA = (a.server || "").toLowerCase();
        const serverB = (b.server || "").toLowerCase();
        const linkA = a.link || "";
        const linkB = b.link || "";

        // Function to detect High Speed Servers
        const isHighSpeed = (name: string, url: string) => {
            return name.includes("fsl") || 
                   name.includes("10gbps") || 
                   name.includes("zipdisk") ||
                   name.includes("apple") ||
                   url.includes("googleusercontent"); // Google URLs are very fast
        };

        const aIsBest = isHighSpeed(serverA, linkA);
        const bIsBest = isHighSpeed(serverB, linkB);

        // Rule 1: High Speed servers pehle aayenge
        if (aIsBest && !bIsBest) return -1; // A upar
        if (!aIsBest && bIsBest) return 1;  // B upar

        // Rule 2: Agar dono category same hain, to Lamba Link (Long URL) pehle aayega
        // (Lamba link usually signed/tokenized hota hai jo fast chalta hai)
        return linkB.length - linkA.length; 
    });

    // 4. Return Data
    return NextResponse.json({ 
        success: true, 
        title: data.title,
        streams: cleanStreams // Ab isme saare valid servers honge, sorted order me
    });

  } catch (error: any) {
    console.error("N-Cloud API Error:", error.message);
    return NextResponse.json({ success: false, error: 'Failed to fetch streams' });
  }
}
