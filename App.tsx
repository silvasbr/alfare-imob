
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('alfare_auth', 'true');
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

  if (!isAuthenticated) return <Login onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="dark">
      <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 dark:bg-[#0F172A]">
        {/* Sidebar e conteúdo seguem a mesma lógica dos outros arquivos fornecidos */}
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-[#1E293B] border-r border-gray-100 dark:border-gray-800 p-8 h-screen sticky top-0">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center font-black text-black">A</div>
            <h2 className="font-black text-white text-sm uppercase">Alfare Imob</h2>
          </div>
          <nav className="space-y-2">
            <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl font-black text-sm ${view === 'dashboard' ? 'bg-orange-500 text-black' : 'text-gray-400'}`}><Layout size={18}/> PROJETOS</button>
            <button onClick={() => {setEditingPost(null); setView('create');}} className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl font-black text-sm ${view === 'create' ? 'bg-orange-500 text-black' : 'text-gray-400'}`}><Plus size={18}/> NOVO POST</button>
          </nav>
          <div className="mt-auto">
             <button onClick={() => {localStorage.removeItem('alfare_auth'); setIsAuthenticated(false);}} className="flex items-center gap-3 text-red-500 font-black text-xs uppercase p-4"><LogOut size={18}/> SAIR</button>
          </div>
        </aside>
        <main className="flex-1">
          {view === 'dashboard' ? <Dashboard posts={posts} onCreateNew={() => setView('create')} onEditPost={(p) => {setEditingPost(p); setView('create');}} /> : <CreatePost onBack={() => setView('dashboard')} onPostCreated={handlePostCreatedOrUpdated} initialData={editingPost || undefined} />}
        </main>
      </div>
    </div>
  );
};
export default App;
