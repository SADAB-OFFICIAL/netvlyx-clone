'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Cloud, Trash2, Copy, Check, FileText, Video, 
  Image as ImageIcon, Music, Package, Search, 
  RefreshCw, ShieldAlert, HardDrive, Filter, Loader2
} from 'lucide-react';

interface FileItem {
  name: string;
  size: string;
  uploadedAt: string;
  url: string;
}

// --- MAIN CONTENT COMPONENT (Logic yahan hai) ---
function NCloudContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // States
  const [authorized, setAuthorized] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState<string | null>(null);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const key = searchParams.get('key');
    const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY;

    // Check Key
    if (key === adminKey) {
      setAuthorized(true);
      fetchFiles();
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ncloud-files');
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      setError('Could not load cloud files.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Permanently delete "${fileName}"?`)) return;

    try {
      const res = await fetch('/api/delete-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });

      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.name !== fileName));
      } else {
        alert('Failed to delete file');
      }
    } catch (e) {
      alert('Error deleting file');
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopying(url);
    setTimeout(() => setCopying(null), 2000);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['mp4', 'mkv', 'webm', 'mov'].includes(ext || '')) return <Video className="text-blue-500" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <ImageIcon className="text-purple-500" />;
    if (['mp3', 'wav', 'aac'].includes(ext || '')) return <Music className="text-green-500" />;
    if (['zip', 'rar', '7z', 'tar'].includes(ext || '')) return <Package className="text-yellow-500" />;
    return <FileText className="text-gray-400" />;
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    let matchesType = true;
    if (filterType === 'video') matchesType = ['mp4', 'mkv', 'webm'].includes(ext || '');
    if (filterType === 'image') matchesType = ['jpg', 'png', 'webp'].includes(ext || '');
    
    return matchesSearch && matchesType;
  });

  if (!loading && !authorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6 space-y-4">
        <ShieldAlert size={64} className="text-red-600 animate-pulse" />
        <h1 className="text-3xl font-bold text-white">Access Restricted</h1>
        <p className="text-gray-500 max-w-md">This is a secure cloud storage area. You need an admin key.</p>
        <button onClick={() => router.push('/')} className="mt-4 px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 pb-20">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Cloud className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">N-Cloud Storage</h1>
              <p className="text-xs text-gray-500 flex items-center gap-2">{files.length} Files <span className="w-1 h-1 bg-gray-600 rounded-full"></span> Secure Admin Mode</p>
            </div>
          </div>

          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <input 
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
             <button onClick={fetchFiles} disabled={loading} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all active:scale-95 disabled:opacity-50">
               <RefreshCw size={18} className={loading ? 'animate-spin text-blue-400' : 'text-gray-400'} />
             </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
           <div className="bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/20 p-5 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400"><HardDrive size={24} /></div>
              <div>
                 <p className="text-xs text-blue-300 font-bold uppercase">Total Files</p>
                 <h3 className="text-2xl font-bold text-white">{files.length}</h3>
              </div>
           </div>
           <div className="md:col-span-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {['all', 'video', 'image'].map(type => (
                 <button key={type} onClick={() => setFilterType(type)} className={`px-6 py-3 rounded-xl border text-sm font-bold capitalize transition-all whitespace-nowrap ${filterType === type ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:border-white/20'}`}>
                    {type === 'all' ? 'All Files' : type + 's'}
                 </button>
              ))}
           </div>
        </div>

        {loading && (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (<div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse border border-white/5"></div>))}
           </div>
        )}

        {error && (
           <div className="p-8 text-center border border-red-500/20 bg-red-500/5 rounded-2xl">
              <p className="text-red-400">{error}</p>
              <button onClick={fetchFiles} className="mt-4 text-sm font-bold underline">Try Again</button>
           </div>
        )}

        {!loading && !error && (
           <>
             {filteredFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {filteredFiles.map((file, idx) => (
                      <div key={idx} className="group relative bg-[#0f0f0f] hover:bg-[#141414] border border-white/5 hover:border-blue-500/30 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50">
                         <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-black rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
                               {getFileIcon(file.name)}
                            </div>
                            <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">{file.size || 'N/A'}</span>
                         </div>
                         <h3 className="font-bold text-sm text-gray-200 truncate mb-1" title={file.name}>{file.name}</h3>
                         <p className="text-xs text-gray-500 mb-4">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                         <div className="grid grid-cols-2 gap-2 mt-auto">
                            <button onClick={() => handleCopy(file.url)} className="flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition-colors border border-white/5">
                               {copying === file.url ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>} {copying === file.url ? 'Copied' : 'Copy'}
                            </button>
                            <button onClick={() => handleDelete(file.name)} className="flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold transition-colors border border-red-500/10">
                               <Trash2 size={14} /> Delete
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="text-center py-20">
                   <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4"><Filter className="text-gray-500" /></div>
                   <h3 className="text-lg font-bold text-gray-300">No files found</h3>
                   <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
                </div>
             )}
           </>
        )}
      </main>
    </div>
  );
}

// --- DEFAULT EXPORT WITH SUSPENSE BOUNDARY ---
export default function NCloudPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    }>
      <NCloudContent />
    </Suspense>
  );
}
