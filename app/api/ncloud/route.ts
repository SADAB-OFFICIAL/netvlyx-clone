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

    // 2. FILTERING LOGIC (Only Best Servers)
    const validStreams = data.streams.filter((stream: any) => {
        const link = stream.link || "";
        const server = stream.server || "";

        // A. Reject obvious junk
        if (link.includes("icons8.com")) return false; // Icon links
        if (link.includes("hubcloud.foo/drive")) return false; // Recursive link
        if (link.endsWith("token=")) return false; // Empty token
        if (link.length < 50) return false; // Too short to be a real tokenized video link

        // B. Accept Priority Servers (FSL, ZipDisk, etc.)
        const isPriority = 
            server.includes("FSL") || 
            server.includes("ZipDisk") || 
            server.includes("Apple") || // Kabhi kabhi Apple server bhi aata hai
            server.includes("PixelDrain");

        return isPriority;
    });

    // 3. Return Filtered Data
    return NextResponse.json({ 
        success: true, 
        title: data.title,
        streams: validStreams
    });

  } catch (error: any) {
    console.error("N-Cloud API Error:", error.message);
    return NextResponse.json({ success: false, error: 'Failed to fetch streams' });
  }
}
