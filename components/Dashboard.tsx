
import React, { useState, useMemo } from 'react';
import { PropertyData } from '../types';
import { Plus, Search, Calendar, Edit2, MapPin, SlidersHorizontal, Download, Trash2, Home, BarChart3, Clock, LayoutGrid } from 'lucide-react';
import JSZip from 'jszip';
import saveAs from 'file-saver';

interface Props {
  posts: PropertyData[];
  onCreateNew: () => void;
  onEditPost: (post: PropertyData) => void;
  onDeletePost: (id: string) => void;
}

export const Dashboard: React.FC<Props> = ({ posts, onCreateNew, onEditPost, onDeletePost }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = useMemo(() => {
    return posts.filter(post => 
      post.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      post.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.price?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [posts, searchTerm]);

  const stats = useMemo(() => {
    const total = posts.length;
    const houses = posts.filter(p => p.type === 'CASA').length;
    const apts = posts.filter(p => p.type === 'APARTAMENTO').length;
    return { total, houses, apts };
  }, [posts]);

  const handleExportProject = async () => {
    const zip = new JSZip();
    zip.file("projetos_alfare.json", JSON.stringify(posts, null, 2));
    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "backup-alfare-imob.zip");
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* Header Centralizado */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-orange-500">
            <BarChart3 size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Painel Administrativo</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">Meus Projetos</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportProject}
            className="hidden md:flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-3 px-6 rounded-2xl transition-all text-[11px] uppercase tracking-wider border border-white/10"
          >
            <Download size={16} /> Exportar Dados
          </button>
          <button 
            onClick={onCreateNew}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-black font-black py-3 px-6 rounded-2xl transition-all shadow-xl shadow-orange-500/10 active:scale-95 text-xs uppercase tracking-tight"
          >
            <Plus size={18} strokeWidth={3} /> Criar Novo Post
          </button>
        </div>
      </header>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#1E293B] p-6 rounded-[2rem] border border-white/5 flex items-center gap-5">
          <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
            <LayoutGrid size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Total de Posts</p>
            <p className="text-2xl font-black">{stats.total}</p>
          </div>
        </div>
        <div className="bg-[#1E293B] p-6 rounded-[2rem] border border-white/5 flex items-center gap-5">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
            <Home size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Tipos Ativos</p>
            <p className="text-2xl font-black">{stats.houses} Cs / {stats.apts} Ap</p>
          </div>
        </div>
        <div className="bg-[#1E293B] p-6 rounded-[2rem] border border-white/5 flex items-center gap-5">
          <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Status Sistema</p>
            <p className="text-2xl font-black">ONLINE</p>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-[#1E293B]/50 p-3 rounded-[2.5rem] border border-white/5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por bairro, cidade ou preço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-4 bg-transparent outline-none font-bold text-sm text-white placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Grid de Imóveis */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/5">
          <Calendar size={32} className="text-gray-700 mb-4" />
          <p className="text-gray-500 font-black text-xs uppercase tracking-[0.3em]">Nenhum projeto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPosts.map((post) => (
            <div key={post.id} className="group bg-[#1E293B] rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-orange-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/5 hover:-translate-y-2">
              <div className="relative aspect-[4/5] overflow-hidden">
                <img src={post.images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Capa" />
                
                <div className="absolute top-5 left-5 flex flex-col gap-2">
                  <span className="bg-orange-500 text-black text-[9px] font-black px-3 py-1.5 rounded-lg uppercase shadow-lg">
                    {post.negotiation}
                  </span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => onEditPost(post)} 
                        className="bg-white text-black font-black py-3 rounded-xl text-[10px] flex items-center justify-center gap-2 hover:bg-orange-500 transition-colors uppercase"
                      >
                        <Edit2 size={14} /> Editar
                      </button>
                      <button 
                        onClick={() => onDeletePost(post.id)}
                        className="bg-red-500/20 backdrop-blur-md text-red-500 border border-red-500/20 font-black py-3 rounded-xl text-[10px] flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all uppercase"
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                   </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-black text-white text-sm uppercase truncate group-hover:text-orange-500 transition-colors">
                      {post.neighborhood}
                    </h3>
                    <p className="text-orange-500 font-black text-sm">{post.price}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <MapPin size={12} className="text-gray-600" />
                    <p className="text-[10px] font-bold uppercase tracking-widest truncate">{post.city}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-gray-500">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-white">{post.area}m²</span>
                    <span className="text-[8px] uppercase font-bold text-gray-600">Área</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-white">{post.beds}</span>
                    <span className="text-[8px] uppercase font-bold text-gray-600">Dorms</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-white">{post.parking}</span>
                    <span className="text-[8px] uppercase font-bold text-gray-600">Vagas</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
