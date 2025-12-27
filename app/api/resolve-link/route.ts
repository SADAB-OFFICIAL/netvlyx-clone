// app/api/resolve-link/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { HttpsProxyAgent } from 'https-proxy-agent'; // npm install https-proxy-agent

// List of free proxies (Production mein premium proxy use karein)
const PROXIES = [
  'http://103.152.112.162:80',
  'http://202.162.212.164:80',
  // Add more working proxies here
];

const getRandomProxy = () => PROXIES[Math.floor(Math.random() * PROXIES.length)];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s Timeout

    // 1. Setup Proxy Agent (Optional: Only if normal fetch fails)
    const fetchOptions: any = {
       headers: { 
         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
         'Referer': 'https://google.com'
       },
       signal: controller.signal,
       redirect: 'follow'
    };

    // Agar premium proxy hai to yahan agent lagayein
    // const agent = new HttpsProxyAgent('http://user:pass@proxy-ip:port');
    // fetchOptions.agent = agent;

    console.log(`Fetching: ${url}`);
    
    // 2. Fetch Page
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    // ... (Baaki scraping logic same rahega) ...
    // ... (Jo maine pichle response mein diya tha) ...

    // Example scraping logic recap:
    const linksFound: any[] = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if(href && (href.includes('drive') || href.includes('pixel') || href.includes('hubcloud'))) {
            linksFound.push({ title: text, link: href });
        }
    });
    
    // ...

    return NextResponse.json({ success: true, items: linksFound });

  } catch (error) {
    console.error("Proxy Fetch Error:", error);
    return NextResponse.json({ 
        success: false, 
        error: 'Failed to resolve link. Site might be blocked.' 
    });
  }
}
