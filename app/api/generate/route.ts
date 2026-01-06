import { NextRequest, NextResponse } from 'next/server';

// ⚡ Edge Runtime (Fast Execution ke liye)
export const runtime = 'edge';

// 🔒 Constants (Wahi same trick)
const TOKEN_SOURCE = "https://vcloud.zip/hr17ehaeym7rza9";
const PROXY = "https://proxy.vlyx.workers.dev";
const BASE_URL = "https://gamerxyt.com/hubcloud.php";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  const action = searchParams.get('action') || 'download';

  // 1. Check Key
  if (!key) {
    return NextResponse.json({ error: "Missing 'key' parameter" }, { status: 400 });
  }

  try {
    // 2. Decode Key (Base64 -> JSON)
    // NCloud/Netvlyx se jo key aati hai wo encoded hoti hai
    const decodedString = atob(key);
    const data = JSON.parse(decodedString);

    if (!data.url) throw new Error('Invalid data structure: URL missing');

    // 3. Generate New Link (Magic Trick)
    const generatedLink = await generateHubCloudLink(data.url);
    
    // 4. Update Data
    data.url = generatedLink;
    
    // 5. Re-Encode for Response
    const newKey = btoa(JSON.stringify(data));

    // 6. Return JSON (Frontend isse handle karega)
    return NextResponse.json({
        success: true,
        originalUrl: data.url,
        generatedLink: generatedLink,
        newKey: newKey,
        nextUrl: `/gen?key=${newKey}&action=${action}`
    });

  } catch (err: any) {
    console.error("Generator Error:", err);
    return NextResponse.json({ error: err.message || 'Processing failed' }, { status: 500 });
  }
}

// --- HELPER FUNCTIONS ---

// 🕵️‍♂️ Step 1: Token Chori Karna (Scraping)
async function getToken() {
  try {
    const res = await fetch(`${PROXY}/?url=${encodeURIComponent(TOKEN_SOURCE)}`, {
      cache: 'no-store'
    });

    if (!res.ok) return null;

    const html = await res.text();
    // Regex se token nikalna: token='XYZ'
    const match = html.match(/token=([^&']+)/);
    
    return match ? match[1] : null;
  } catch (e) {
    console.error("Token Fetch Error:", e);
    return null;
  }
}

// 🔗 Step 2: Link Banana
async function generateHubCloudLink(inputUrl: string) {
  // HubCloud Link se ID nikalna (e.g. https://hubcloud.run/drive/xyz123)
  // Logic: Last part of URL is ID
  const urlObj = new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`);
  
  // ID Extraction fix: kabhi kabhi last mein slash hota hai
  const pathParts = urlObj.pathname.replace(/\/$/, '').split('/');
  const id = pathParts.pop(); // Last hissa ID hai

  if (!id || id.length <= 3) throw new Error("Invalid HubCloud ID");

  // Token lao
  const token = await getToken();
  if (!token) throw new Error("Failed to fetch bypass token");

  // Final API Call URL banao
  return `${BASE_URL}?host=hubcloud&id=${id}&token=${token}`;
}
