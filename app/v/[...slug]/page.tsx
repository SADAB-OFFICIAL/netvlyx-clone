import { Metadata } from 'next';
import MovieClient from './MovieClient'; // Aapka purana logic wala component

// Helper to decode URL (Same logic as your client file but for Server)
const decodeSlug = (slugArray: string[]) => {
  try {
    const base64 = slugArray.join('/').replace(/-/g, '+').replace(/_/g, '/');
    // Server side decoding
    return atob(base64); 
  } catch (e) {
    return '';
  }
};

// --- DYNAMIC METADATA GENERATION ---
export async function generateMetadata({ params }: { params: { slug: string[] } }): Promise<Metadata> {
  // 1. URL Decode karein
  const slug = (await params).slug; // Next.js 15 support ke liye await
  const movieUrl = decodeSlug(slug);
  
  // Default Metadata (Agar fetch fail ho jaye)
  const defaultMeta = {
    title: 'Watch Online - Sadabefy',
    description: 'Stream your favorite movies and series in HD on Sadabefy.',
  };

  if (!movieUrl) return defaultMeta;

  try {
    // 2. API se Data Fetch karein (Server Side)
    // Note: Localhost pe full URL chahiye hoti hai. Production mein apna domain set karein.
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'; 
    
    const res = await fetch(`${baseUrl}/api/movie-details?url=${encodeURIComponent(movieUrl)}`, {
        next: { revalidate: 3600 } // Cache 1 hour ke liye taaki fast ho
    });
    
    const data = await res.json();
    
    if (!data || data.error) return defaultMeta;

    // 3. SEO Tags Return karein
    return {
      title: `Watch ${data.title} - Sadabefy`,
      description: data.plot ? data.plot.substring(0, 160) + '...' : `Stream ${data.title} in High Quality.`,
      openGraph: {
        title: data.title,
        description: data.plot || `Watch ${data.title} on Sadabefy`,
        images: data.poster ? [{ url: data.poster, width: 1200, height: 630 }] : [],
        type: 'video.movie',
        siteName: 'Sadabefy',
      },
      twitter: {
        card: 'summary_large_image',
        title: data.title,
        description: data.plot,
        images: data.poster ? [data.poster] : [],
      }
    };
  } catch (e) {
    console.error("SEO Fetch Error:", e);
    return defaultMeta;
  }
}

// --- MAIN PAGE COMPONENT ---
export default function Page() {
  // Ye server component sirf SEO handle karega
  // Aur turant aapke Client Component (UI) ko render kar dega
  return <MovieClient />;
}
