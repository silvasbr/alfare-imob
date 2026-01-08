
import React, { useState, useEffect } from 'react';
import { PropertyData } from './types.ts';
import { Dashboard } from './components/Dashboard.tsx';
import { CreatePost } from './components/CreatePost.tsx';
import { Login } from './components/Login.tsx';
import { Layout, LogOut, Plus, Menu, X } from 'lucide-react';
import { metaService, type MetaAccountStatus } from './services/metaService.ts';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<'dashboard' | 'create'>('dashboard');
  const [posts, setPosts] = useState<PropertyData[]>([]);
  const [editingPost, setEditingPost] = useState<PropertyData | null>(null);
  const [metaConnected, setMetaConnected] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('alfare_posts');
    if (saved) {
      try { setPosts(JSON.parse(saved)); } catch (e) { console.error('Erro ao carregar posts:', e); }
    }
    const auth = localStorage.getItem('alfare_auth');
    if (auth === 'true') setIsAuthenticated(true);
    
    metaService.getAccountStatus().then((res: MetaAccountStatus) => setMetaConnected(res.connected));
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('alfare_auth', 'true');
  };

  const handleLogout = () => {
    localStorage.removeItem('alfare_auth');
    setIsAuthenticated(false);
  };

  const handlePostCreatedOrUpdated = (updatedPost: PropertyData) => {
    setPosts(prevPosts => {
      let newPosts;
      const index = prevPosts.findIndex(p => p.id === updatedPost.id);
      if (index !== -1) {
        newPosts = [...prevPosts];
        newPosts[index] = updatedPost;
      } else {
        newPosts = [updatedPost, ...prevPosts];
      }
      localStorage.setItem('alfare_posts', JSON.stringify(newPosts));
      return newPosts;
    });
    setEditingPost(null);
    setView('dashboard');
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="dark">
      <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 dark:bg-[#0F172A]">
        
        {/* Mobile Header */}
        <div className="lg:hidden bg-[#1E293B] p-4 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-black text-black text-sm">A</div>
            <h2 className="font-black text-white text-xs uppercase">Alfare Imob</h2>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Sidebar */}
        <aside className={`${isMobileMenuOpen ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-64 bg-white dark:bg-[#1E293B] border-r border-gray-100 dark:border-gray-800 p-8 h-auto lg:h-screen sticky top-0 z-50`}>
          <div className="hidden lg:flex items-center gap-4 mb-12">
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center font-black text-black">A</div>
            <h2 className="font-black text-white text-sm uppercase">Alfare Imob</h2>
          </div>
          
          <nav className="space-y-2">
            <button 
              onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }} 
              className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl font-black text-sm transition-all ${view === 'dashboard' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white'}`}
            >
              <Layout size={18}/> PROJETOS
            </button>
            <button 
              onClick={() => { setEditingPost(null); setView('create'); setIsMobileMenuOpen(false); }} 
              className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl font-black text-sm transition-all ${view === 'create' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white'}`}
            >
              <Plus size={18}/> NOVO POST
            </button>
          </nav>

          <div className="mt-auto pt-8 lg:pt-0">
             <button onClick={handleLogout} className="flex items-center gap-3 text-red-500 font-black text-xs uppercase p-4 hover:bg-red-500/10 rounded-xl transition-all w-full text-left">
               <LogOut size={18}/> SAIR DA CONTA
             </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {view === 'dashboard' ? (
            <Dashboard 
              posts={posts} 
              onCreateNew={() => setView('create')} 
              onEditPost={(p: PropertyData) => { setEditingPost(p); setView('create'); }} 
            />
          ) : (
            <CreatePost 
              onBack={() => setView('dashboard')} 
              onPostCreated={handlePostCreatedOrUpdated} 
              initialData={editingPost || undefined} 
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
