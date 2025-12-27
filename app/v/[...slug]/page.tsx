// app/v/[...slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Play, Download, HardDrive } from 'lucide-react';

export default function MoviePage() {
  const { slug } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Decode URL from slug
  const movieUrl = slug ? atob((slug as string[]).join('/').replace(/-/g, '+').replace(/_/g, '/')) : '';

  useEffect(() => {
    if (!movieUrl) return;

    // Fetch details via backend proxy (You need to implement api/movie-details similar to api/scrape)
    // For now, we simulate data for demonstration
    const fetchData = async () => {
      // In real code: await fetch(`/api/movie-details?url=${encodeURIComponent(movieUrl)}`)
      setTimeout(() => {
        setData({
          title: "Sample Movie (2025)",
          plot: "This is a sample plot extracted from the movie page.",
          poster: "https://via.placeholder.com/300x450",
          downloadSections: [
            {
              title: "Download 720p",
              links: [
                { label: "Hub-Cloud", url: "https://hubcloud.run/drive/sample" },
                { label: "V-Cloud", url: "https://vcloud.zip/v/sample" }
              ]
            }
          ]
        });
        setLoading(false);
      }, 1000);
    };

    fetchData();
  }, [movieUrl]);

  const handleLinkClick = (url: string) => {
    // Logic to redirect to VlyxDrive
    const key = btoa(JSON.stringify({ link: url, source: 'netvlyx' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    router.push(`/vlyxdrive?key=${key}`);
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="mb-4 text-gray-400 hover:text-white">← Back</button>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
            <img src={data.poster} alt={data.title} className="rounded-xl shadow-2xl w-full" />
          </div>
          <div className="w-full md:w-2/3">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {data.title}
            </h1>
            <p className="text-gray-300 mb-6 leading-relaxed">{data.plot}</p>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold border-b border-gray-700 pb-2">Download Links</h3>
              {data.downloadSections.map((section: any, i: number) => (
                <div key={i} className="bg-gray-900 rounded-lg p-4">
                  <h4 className="text-green-400 font-bold mb-3">{section.title}</h4>
                  <div className="flex flex-wrap gap-3">
                    {section.links.map((link: any, j: number) => (
                      <button 
                        key={j}
                        onClick={() => handleLinkClick(link.url)}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-blue-600 px-4 py-2 rounded-md transition-colors"
                      >
                        <HardDrive size={16} />
                        {link.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
