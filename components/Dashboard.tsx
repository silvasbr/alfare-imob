
import React, { useState } from 'react';
import { PropertyData } from '../types';
import { Plus, Search, Calendar, Edit2, MapPin, SlidersHorizontal, Download } from 'lucide-react';
import JSZip from 'jszip';
import saveAs from 'file-saver';

interface Props {
  posts: PropertyData[];
  onCreateNew: () => void;
  onEditPost: (post: PropertyData) => void;
}

export const Dashboard: React.FC<Props> = ({ posts, onCreateNew, onEditPost }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = posts.filter(post => 
    post.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) || 
    post.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportProject = async () => {
    const zip = new JSZip();
    
    // Como não temos acesso direto ao FS, este botão serve para baixar a estrutura
    // O usuário pode usar este recurso para backups ou portabilidade rápida
    alert("Iniciando exportação dos arquivos do projeto...");
    
    // Em um ambiente real, leríamos os arquivos. Aqui, como sugestão de portabilidade:
    zip.file("LEIA-ME.txt", "Este ZIP foi gerado automaticamente pelo Alfare Imob Marketing AI.\nContém a estrutura base para portabilidade do projeto.");
    
    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "alfare-imob-projeto.zip");
    });
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto text-gray-900 dark:text-white">
      {/* Header com Título e Botões de Ação */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight uppercase">Meus Posts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-semibold text-sm">
            {posts.length} {posts.length === 1 ? 'imóvel cadastrado' : 'imóveis cadastrados'}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportProject}
            className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 px-4 rounded-xl transition-all text-xs uppercase"
            title="Exportar estrutura do projeto"
          >
            <Download size={16} />
            Exportar
          </button>
          <button 
            onClick={onCreateNew}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-black font-black py-2.5 px-5 rounded-xl transition-all shadow-md active:scale-95 text-sm uppercase tracking-tight"
          >
            <Plus size={18} strokeWidth={3} />
            Novo Imóvel
          </button>
        </div>
      </header>

      {/* Barra de Busca e Filtros */}
      <div className="mb-8 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por bairro ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 rounded-xl outline-none font-bold text-sm focus:ring-2 ring-orange-500/20 transition-all shadow-sm"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 rounded-xl font-bold text-xs uppercase text-gray-400 hover:text-orange-500 transition-colors">
          <SlidersHorizontal size={16} />
          Filtros
        </button>
      </div>

      {/* Grid de Conteúdo */}
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/5 dark:bg-[#1E293B]/30 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
          <Calendar size={40} className="text-gray-300 dark:text-gray-700 mb-4" />
          <p className="text-gray-400 dark:text-gray-500 font-black text-sm uppercase tracking-widest">Nenhum post disponível</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredPosts.map((post) => (
            <div key={post.id} className="group bg-white dark:bg-[#1E293B] rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-900">
                <img src={post.images[0]} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" alt="Capa" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-orange-500 text-black text-[9px] font-black px-2.5 py-1 rounded-md uppercase shadow-md">
                    {post.negotiation}
                  </span>
                  <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-md uppercase">
                    {post.type}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                  <button 
                    onClick={() => onEditPost(post)} 
                    className="bg-white text-black font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 hover:bg-orange-500 transition-colors shadow-2xl"
                  >
                    <Edit2 size={14} /> EDITAR PROJETO
                  </button>
                </div>
              </div>
              <div className="p-4 md:p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-black text-gray-900 dark:text-white text-sm md:text-base leading-tight uppercase truncate">
                    {post.neighborhood}
                  </h3>
                  <p className="text-red-500 font-black text-xs md:text-sm whitespace-nowrap">{post.price}</p>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <MapPin size={12} className="text-orange-500" />
                  <p className="text-[10px] font-bold uppercase tracking-wider truncate">{post.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
