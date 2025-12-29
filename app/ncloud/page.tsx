'use client';

import React, { useState } from 'react';
import { 
  Cloud, HardDrive, File, Image as ImageIcon, Music, Video, 
  MoreVertical, Search, Plus, Folder, Clock, Trash2, 
  Settings, ChevronRight, UploadCloud, CheckCircle
} from 'lucide-react';

export default function NCloudPage() {
  const [activeTab, setActiveTab] = useState('All Files');
  const [storageUsed, setStorageUsed] = useState(65); // 65% used

  // Mock Data for Files
  const files = [
    { id: 1, name: 'Project_Netvlyx_Final.zip', type: 'zip', size: '1.2 GB', date: 'Just now', icon: <Folder className="text-yellow-500" /> },
    { id: 2, name: 'Avengers_Endgame_4K.mkv', type: 'video', size: '4.5 GB', date: '2 mins ago', icon: <Video className="text-blue-500" /> },
    { id: 3, name: 'Design_Mockups_v2.fig', type: 'image', size: '12 MB', date: '1 hour ago', icon: <ImageIcon className="text-purple-500" /> },
    { id: 4, name: 'Resume_Sadab.pdf', type: 'doc', size: '2.4 MB', date: 'Yesterday', icon: <File className="text-red-500" /> },
    { id: 5, name: 'Audio_Podcast_Ep1.mp3', type: 'audio', size: '45 MB', date: '2 days ago', icon: <Music className="text-green-500" /> },
  ];

  // Storage Categories
  const storageStats = [
    { label: 'Images', size: '12 GB', color: 'bg-purple-500', icon: <ImageIcon size={16}/> },
    { label: 'Videos', size: '45 GB', color: 'bg-blue-500', icon: <Video size={16}/> },
    { label: 'Docs', size: '5 GB', color: 'bg-red-500', icon: <File size={16}/> },
    { label: 'Others', size: '18 GB', color: 'bg-yellow-500', icon: <Folder size={16}/> },
  ];

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* --- SIDEBAR (Glassy) --- */}
      <aside className="w-64 bg-[#0a0a0a]/50 backdrop-blur-xl border-r border-white/5 flex flex-col hidden md:flex">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cloud className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">N-Cloud</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {[
            { name: 'My Drive', icon: HardDrive },
            { name: 'Recent', icon: Clock },
            { name: 'Starred', icon: Folder },
            { name: 'Trash', icon: Trash2 },
          ].map((item) => (
            <button 
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === item.name ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon size={18} />
              {item.name}
            </button>
          ))}
        </nav>

        {/* Storage Widget */}
        <div className="p-6 mt-auto">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-center mb-2 relative z-10">
              <span className="text-xs font-bold text-gray-400">Storage</span>
              <span className="text-xs font-bold text-blue-400">80 GB / 120 GB</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden relative z-10">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: `${storageUsed}%` }}></div>
            </div>
            <button className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors relative z-10">Upgrade Plan</button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-96 bg-blue-900/10 blur-[100px] pointer-events-none"></div>

        {/* Header */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-[#050505]/80 backdrop-blur-md z-20">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            My Drive <ChevronRight size={16} className="text-gray-600" /> <span className="text-base font-normal text-gray-400">Overview</span>
          </h2>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search files..." 
                className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/10 w-64 transition-all"
              />
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center font-bold text-black shadow-lg shadow-orange-500/20 cursor-pointer">S</div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          
          {/* Quick Stats Row */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {storageStats.map((stat, idx) => (
              <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer group">
                <div className={`w-10 h-10 rounded-lg ${stat.color} bg-opacity-20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                   <div className={`${stat.color.replace('bg-', 'text-')} opacity-100`}>{stat.icon}</div>
                </div>
                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider">{stat.label}</h4>
                <p className="text-xl font-bold mt-1">{stat.size}</p>
              </div>
            ))}
          </section>

          {/* Upload Area & Recent */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Upload Zone */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border-2 border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group bg-white/[0.02]">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="text-blue-500" size={32} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Drag & Drop files here</h3>
                <p className="text-gray-500 text-sm mb-6">Supported formats: JPG, PNG, MP4, PDF, ZIP</p>
                <button className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:bg-blue-500 hover:text-white transition-all shadow-lg flex items-center gap-2">
                  <Plus size={16} /> Upload New
                </button>
              </div>

              {/* Recent Files Table */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock size={18} className="text-blue-500"/> Recent Uploads</h3>
                <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                        <th className="p-4 font-medium">Name</th>
                        <th className="p-4 font-medium">Size</th>
                        <th className="p-4 font-medium">Modified</th>
                        <th className="p-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {files.map((file) => (
                        <tr key={file.id} className="hover:bg-white/5 transition-colors group">
                          <td className="p-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center">{file.icon}</div>
                            <span className="font-medium text-sm group-hover:text-blue-400 transition-colors">{file.name}</span>
                          </td>
                          <td className="p-4 text-sm text-gray-400">{file.size}</td>
                          <td className="p-4 text-sm text-gray-400">{file.date}</td>
                          <td className="p-4 text-right">
                            <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Quick Access / Details Panel */}
            <div className="bg-gradient-to-b from-blue-900/20 to-transparent border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                   <Cloud size={120} />
                </div>
                <h3 className="text-xl font-bold mb-6 relative z-10">Your Cloud</h3>
                
                <div className="space-y-6 relative z-10">
                   <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-3 mb-2">
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                         <span className="text-sm font-bold text-gray-300">System Status</span>
                      </div>
                      <p className="text-xs text-green-400 font-medium">All Systems Operational</p>
                   </div>

                   <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/5">
                      <h4 className="text-sm font-bold text-gray-300 mb-4">Storage Distribution</h4>
                      <div className="flex items-end justify-between h-32 gap-2">
                         {[40, 75, 30, 55].map((h, i) => (
                            <div key={i} className="w-full bg-gray-800 rounded-t-lg relative group">
                               <div className="absolute bottom-0 w-full bg-blue-600 rounded-t-lg transition-all duration-1000 group-hover:bg-blue-400" style={{ height: `${h}%` }}></div>
                            </div>
                         ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                         <span>img</span><span>vid</span><span>doc</span><span>oth</span>
                      </div>
                   </div>
                </div>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}
