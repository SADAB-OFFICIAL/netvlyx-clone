import * as cheerio from 'cheerio';

export const extractImdbId = (html: string): string | null => {
    const $ = cheerio.load(html);
    let imdbId = null;

    // 🕵️‍♂️ Logic: Find 'strong' tag with 'iMDB Rating' text
    // HTML Structure: <strong>🌟iMDB Rating: </strong><a href="...">
    $('strong').each((i, el) => {
        const text = $(el).text();
        
        if (text.includes('iMDB Rating')) {
            // Uske bagal wala <a> tag dhoondo
            const link = $(el).next('a').attr('href');
            
            if (link) {
                // Regex se ID (tt1234567) nikaalo
                const match = link.match(/(tt\d+)/);
                if (match) {
                    imdbId = match[1];
                }
            }
        }
    });

    return imdbId; // e.g., 'tt33014583' ya null
};
