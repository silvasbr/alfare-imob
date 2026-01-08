
import React, { useState, useEffect } from 'react';
import { PropertyData } from './types';
import { Dashboard } from './components/Dashboard';
import { CreatePost } from './components/CreatePost';
import { Login } from './components/Login';
import { Layout, LogOut, Plus, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<'dashboard' | 'create'>('dashboard');
  const [posts, setPosts] = useState<PropertyData[]>([]);
  const [editingPost, setEditingPost] = useState<PropertyData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('alfare_posts');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        setPosts(Array.isArray(parsed) ? parsed : []); 
      } catch (e) { 
        console.error('Erro ao carregar posts:', e); 
        setPosts([]);
      }
    }
    const auth = localStorage.getItem('alfare_auth');
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('alfare_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('alfare_auth');
  };

  const handlePostCreatedOrUpdated = (updatedPost: PropertyData) => {
    setPosts((prevPosts) => {
      let newPosts;
      const index = prevPosts.findIndex((p) => p.id === updatedPost.id);
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

  const handleDeletePost = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este projeto?')) {
      setPosts((prev) => {
        const filtered = prev.filter(p => p.id !== id);
        localStorage.setItem('alfare_posts', JSON.stringify(filtered));
        return filtered;
      });
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="dark">
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#0F172A] text-white">
        {/* Mobile Header */}
        <div className="lg:hidden bg-[#1E293B] p-4 flex items-center justify-between border-b border-gray-800 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-black text-black text-sm">A</div>
            <h2 className="font-black text-white text-xs uppercase tracking-tighter">Alfare Imob</h2>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Sidebar */}
        <aside className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} fixed lg:relative lg:flex flex-col w-72 bg-[#1E293B] border-r border-white/5 p-8 h-screen z-50 transition-transform duration-300 ease-in-out`}>
          <div className="hidden lg:flex items-center gap-4 mb-12">
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center font-black text-black text-xl shadow-lg shadow-orange-500/20">A</div>
            <div>
              <h2 className="font-black text-white text-sm uppercase leading-none">Alfare Imob</h2>
              <span className="text-[9px] text-orange-500 font-bold tracking-widest uppercase">Marketing AI</span>
            </div>
          </div>
          
          <nav className="space-y-3">
            <button 
              onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }} 
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs transition-all duration-200 ${view === 'dashboard' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Layout size={18}/> PROJETOS
            </button>
            <button 
              onClick={() => { setEditingPost(null); setView('create'); setIsMobileMenuOpen(false); }} 
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs transition-all duration-200 ${view === 'create' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Plus size={18}/> NOVO POST
            </button>
          </nav>

          <div className="mt-auto pt-8">
             <button onClick={handleLogout} className="flex items-center gap-3 text-red-500 font-black text-[10px] uppercase tracking-widest p-4 hover:bg-red-500/10 rounded-2xl w-full transition-colors">
               <LogOut size={18}/> ENCERRAR SESSÃO
             </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[#0F172A]">
          {view === 'dashboard' ? (
            <Dashboard 
              posts={posts} 
              onCreateNew={() => setView('create')} 
              onEditPost={(p) => { setEditingPost(p); setView('create'); }}
              onDeletePost={handleDeletePost}
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
