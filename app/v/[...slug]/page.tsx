// app/v/[...slug]/page.tsx
import { Metadata } from 'next';
import MovieClient from './MovieClient';

// Helper to decode URL
const decodeSlug = (slugArray: string[]) => {
  try {
    const base64 = slugArray.join('/').replace(/-/g, '+').replace(/_/g, '/');
    return atob(base64); 
  } catch (e) {
    return '';
  }
};

export async function generateMetadata({ params }: { params: { slug: string[] } }): Promise<Metadata> {
  const slug = (await params).slug; 
  const movieUrl = decodeSlug(slug);
  
  const defaultMeta = {
    title: 'Watch Online - Sadabefy',
    description: 'Stream your favorite movies and series in HD.',
  };

  if (!movieUrl) return defaultMeta;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'; 
    const res = await fetch(`${baseUrl}/api/movie-details?url=${encodeURIComponent(movieUrl)}`, {
        next: { revalidate: 3600 }
    });
    const data = await res.json();
    
    if (!data || data.error) return defaultMeta;

    return {
      title: `Watch ${data.title} - Sadabefy`,
      description: data.plot ? data.plot.substring(0, 160) + '...' : `Stream ${data.title} in High Quality.`,
      openGraph: {
        title: data.title,
        description: data.plot || `Watch ${data.title} on Sadabefy`,
        images: data.poster ? [{ url: data.poster }] : [],
      }
    };
  } catch (e) {
    return defaultMeta;
  }
}

export default function Page() {
  return <MovieClient />;
}
