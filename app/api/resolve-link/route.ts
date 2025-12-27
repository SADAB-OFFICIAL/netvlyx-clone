// app/api/resolve-link/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'URL Required' }, { status: 400 });

  try {
    // 1. Fetch the Page
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await response.text();
    const $ = cheerio.load(html);

    // --- LOGIC: Check for Folder/List Structure ---
    // (HubCloud/Drive sites par aksar table rows ya multiple links hote hain)
    
    const linksFound: any[] = [];
    
    // Pattern 1: Table Rows (Common in Drive/Folder pages)
    $('table tr, .file-list .item').each((i, el) => {
      const linkEl = $(el).find('a').first();
      const name = linkEl.text().trim() || $(el).find('.filename').text().trim();
      const href = linkEl.attr('href');
      
      if (href && name && !name.toLowerCase().includes('parent directory')) {
        linksFound.push({ title: name, link: href });
      }
    });

    // Pattern 2: Simple List (Agar table nahi hai)
    if (linksFound.length === 0) {
       $('.entry-content a, .list-group-item a').each((i, el) => {
          const href = $(el).attr('href');
          const text = $(el).text().trim();
          // Filter garbage links
          if (href && (href.includes('drive') || href.includes('file')) && text.length > 3) {
             linksFound.push({ title: text, link: href });
          }
       });
    }

    // --- DECISION TIME ---
    if (linksFound.length > 1) {
       // CASE A: It's a Folder (Return List)
       return NextResponse.json({ 
         success: true, 
         type: 'folder', 
         items: linksFound 
       });
    } else {
       // CASE B: It's a Single File (Direct Resolve)
       // (Purana logic: Find HubCloud/VCloud link)
       let resolvedUrl = '';
       $('a').each((i, el) => {
         const href = $(el).attr('href');
         if (href && (href.includes('hubcloud') || href.includes('vcloud') || href.includes('pixel') || href.includes('drive'))) {
           resolvedUrl = href;
           return false; 
         }
       });
       
       // Fallback
       if (!resolvedUrl) resolvedUrl = $('.btn-success, .btn-primary').attr('href') || url;

       return NextResponse.json({ 
         success: true, 
         type: 'file', 
         url: resolvedUrl 
       });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Resolution Failed' });
  }
}
