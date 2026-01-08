
import React, { useState, useRef, useEffect } from 'react';
import { PropertyData, PostFormat, NegotiationType, PropertyType, ImageFitMode, SequenceItem } from '../types';
import { parsePropertyInfo, generateCaptions } from '../services/geminiService';
import { metaService } from '../services/metaService';
import { Loader2, ArrowLeft, X, Upload, Ruler, Bed, Car, Bath, Star, MapPin, Tag, Sparkles, Music, Maximize2, Minimize2, Send, CheckCircle2, Play, Download, RefreshCcw, Save, BrainCircuit, ArrowLeftRight, ChevronLeft, ChevronRight, Layers, Clapperboard, LayoutGrid } from 'lucide-react';
import { PostCanvas } from './PostCanvas';
import { VideoReels, VideoReelsHandle } from './VideoReels';
import JSZip from 'jszip';
import saveAs from 'file-saver';

interface Props {
  onBack: () => void;
  onPostCreated: (post: PropertyData) => void;
  initialData?: PropertyData;
}

const PRESET_AUDIOS = [
  { name: 'House Deep', url: 'https://assets.mixkit.co/music/preview/mixkit-house-deep-atmosphere-246.mp3' },
  { name: 'Luxo Moderno', url: 'https://assets.mixkit.co/music/preview/mixkit-uplifting-and-inspiring-corporate-883.mp3' },
  { name: 'Minimalista', url: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibe-130.mp3' }
];

export const CreatePost: React.FC<Props> = ({ onBack, onPostCreated, initialData }) => {
  const [url, setUrl] = useState(initialData?.url || '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  
  const [price, setPrice] = useState(initialData?.price || '');
  const [locationPrefix, setLocationPrefix] = useState(initialData?.locationPrefix || '');
  const [neighborhood, setNeighborhood] = useState(initialData?.neighborhood || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [type, setType] = useState<PropertyType>(initialData?.type || PropertyType.HOUSE);
  const [negotiation, setNegotiation] = useState<NegotiationType>(initialData?.negotiation || NegotiationType.SELL);
  
  const [area, setArea] = useState(initialData?.area || '');
  const [beds, setBeds] = useState(initialData?.beds || '');
  const [baths, setBaths] = useState(initialData?.baths || '');
  const [parking, setParking] = useState(initialData?.parking || '');
  const [amenities, setAmenities] = useState<string[]>(initialData?.amenities || []);

  const [uploadedImages, setUploadedImages] = useState<string[]>(initialData?.images || []);
  const [feedClosingArt, setFeedClosingArt] = useState<string | undefined>(initialData?.feedClosingArt);
  const [reelsClosingArt, setReelsClosingArt] = useState<string | undefined>(initialData?.reelsClosingArt);
  const [reelsCoverArt, setReelsCoverArt] = useState<string | undefined>(initialData?.videoCover);
  
  const [imageFitMode, setImageFitMode] = useState<ImageFitMode>(initialData?.imageFitMode || ImageFitMode.FILL);
  const [audioUrl, setAudioUrl] = useState<string>(initialData?.audioUrl || PRESET_AUDIOS[0].url);

  const [data, setData] = useState<PropertyData | null>(initialData || null);
  const [captions, setCaptions] = useState<{feed: string, reels: string} | null>(null);

  const reelsRef = useRef<VideoReelsHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedClosingArtInputRef = useRef<HTMLInputElement>(null);
  const reelsClosingArtInputRef = useRef<HTMLInputElement>(null);
  const reelsCoverArtInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const blobToBase64 = async (url: string): Promise<string> => {
    if (url.startsWith('data:')) return url;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) { return url; }
  };

  const moveItemInSequence = (format: 'feed' | 'reels', index: number, direction: 'left' | 'right') => {
    if (!data) return;
    const key = format === 'feed' ? 'feedSequence' : 'reelsSequence';
    const sequence = [...(data[key] || [])];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= sequence.length) return;
    
    [sequence[index], sequence[targetIndex]] = [sequence[targetIndex], sequence[index]];
    
    setData({ ...data, [key]: sequence });
    if (format === 'reels') setVideoBlobUrl(null);
  };

  const handleAutoFill = async () => {
    if (!url) return alert("Insira um link ou descrição primeiro.");
    setExtracting(true);
    try {
      const extracted = await parsePropertyInfo(url);
      if (extracted) {
        if (extracted.price) setPrice(extracted.price);
        if (extracted.neighborhood) setNeighborhood(extracted.neighborhood);
        if (extracted.city) setCity(extracted.city);
        if (extracted.area) setArea(extracted.area.toString());
        if (extracted.beds) setBeds(extracted.beds.toString());
        if (extracted.baths) setBaths(extracted.baths.toString());
        if (extracted.parking) setParking(extracted.parking.toString());
        if (extracted.amenities) setAmenities(extracted.amenities);
        if (extracted.type) setType(extracted.type as PropertyType);
        if (extracted.negotiation) setNegotiation(extracted.negotiation as NegotiationType);
        const pref = extracted.type === PropertyType.APARTMENT ? 'APTO NO' : 'CASA NO';
        setLocationPrefix(pref);
      }
    } catch (e) { console.error(e); } finally { setExtracting(false); }
  };

  const handleGenerate = async () => {
    if (!feedClosingArt || !reelsClosingArt || !reelsCoverArt) {
      return alert("Capa Inicial e Artes de Fechamento são obrigatórias!");
    }
    setLoading(true);
    try {
      const timestamp = Date.now();
      const initialFeedSeq: SequenceItem[] = [
        ...uploadedImages.map((url, i) => ({ id: `img-${i}-${timestamp}`, type: 'image' as const, url })),
        { id: `feed-closing-${timestamp}`, type: 'closing' as const, url: feedClosingArt }
      ];

      const initialReelsSeq: SequenceItem[] = [
        { id: `reels-cover-${timestamp}`, type: 'cover' as const, url: reelsCoverArt },
        ...uploadedImages.map((url, i) => ({ id: `img-r-${i}-${timestamp}`, type: 'image' as const, url })),
        { id: `reels-closing-${timestamp}`, type: 'closing' as const, url: reelsClosingArt }
      ];

      const property: PropertyData = {
        id: initialData?.id || Math.random().toString(36).substr(2, 9),
        url,
        price: price || "Sob Consulta",
        locationPrefix: locationPrefix || (type === PropertyType.HOUSE ? 'CASA NO' : 'APTO NO'),
        neighborhood: neighborhood || "Bairro",
        city: city || "Rio Claro",
        type,
        negotiation,
        area: area || "0",
        beds: beds || "0",
        baths: baths || "0",
        parking: parking || "0",
        amenities,
        images: uploadedImages,
        feedClosingArt,
        reelsClosingArt,
        videoCover: reelsCoverArt,
        imageFitMode,
        audioUrl,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        feedSequence: initialFeedSeq,
        reelsSequence: initialReelsSeq
      };
      
      const caps = await generateCaptions(property);
      setData(property);
      setCaptions(caps);
      setStep('preview');
      setVideoBlobUrl(null);
    } catch (e) { alert("Erro ao gerar preview."); } finally { setLoading(false); }
  };

  const handleSaveToDashboard = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const finalPost: PropertyData = {
        ...data,
        images: await Promise.all(data.images.map(img => blobToBase64(img))),
        feedClosingArt: data.feedClosingArt ? await blobToBase64(data.feedClosingArt) : undefined,
        reelsClosingArt: data.reelsClosingArt ? await blobToBase64(data.reelsClosingArt) : undefined,
        videoCover: data.videoCover ? await blobToBase64(data.videoCover) : undefined,
        feedSequence: await Promise.all((data.feedSequence || []).map(async it => ({ ...it, url: await blobToBase64(it.url) }))),
        reelsSequence: await Promise.all((data.reelsSequence || []).map(async it => ({ ...it, url: await blobToBase64(it.url) }))),
      };
      onPostCreated(finalPost);
    } catch (e) { alert("Erro ao salvar no painel."); } finally { setSaving(false); }
  };

  const onRecordingComplete = (blob: Blob) => {
    setRecording(false);
    setVideoBlobUrl(URL.createObjectURL(blob));
  };

  if (step === 'preview' && data && captions) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-10 animate-in slide-in-from-right duration-500 pb-20">
        <header className="flex items-center justify-between mb-8 bg-white/5 backdrop-blur-2xl p-4 md:p-5 rounded-3xl sticky top-4 z-40 border border-white/10 shadow-2xl">
          <button onClick={() => setStep('input')} className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-black dark:text-white hover:bg-orange-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex gap-2 md:gap-3 shrink-0">
            <button 
              onClick={async () => {
                setPublishing(true);
                // Fix: Removed the third argument 'false' as publishToInstagram only accepts two arguments (url and caption)
                const res = await metaService.publishToInstagram(data.images[0], captions.feed);
                setPublishing(false);
                if(res.success) { setPublished(true); setTimeout(() => setPublished(false), 3000); }
              }} 
              disabled={publishing || published} 
              className={`flex items-center gap-2 font-black px-4 md:px-5 py-2.5 rounded-xl text-[11px] md:text-xs transition-all shadow-lg ${published ? 'bg-green-500' : 'bg-gradient-to-r from-purple-600 to-orange-500'} text-white uppercase tracking-tight`}
            >
              {publishing ? <Loader2 className="animate-spin" size={14} /> : published ? <CheckCircle2 size={14} /> : <Send size={14} />}
              {publishing ? 'Publicando' : published ? 'Postado' : 'Postar Agora'}
            </button>
            <button 
              onClick={handleSaveToDashboard} 
              disabled={saving} 
              className="flex items-center gap-2 bg-orange-500 text-black font-black px-4 md:px-5 py-2.5 rounded-xl text-[11px] md:text-xs shadow-lg hover:bg-orange-600 transition-all disabled:opacity-50 uppercase tracking-tight"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Salvar
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 mt-4">
          <div className="lg:col-span-8 space-y-10">
            
            {/* Timeline do Reels */}
            <section className="bg-white dark:bg-[#1E293B] p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base md:text-lg font-black dark:text-white uppercase flex items-center gap-3">
                  <Clapperboard className="text-orange-500" size={20} /> Ordem do Reels
                </h2>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic hidden sm:inline">Personalize o vídeo</span>
              </div>
              <div className="flex gap-3.5 overflow-x-auto pb-4 scrollbar-hide">
                {(data.reelsSequence || []).map((item, i) => (
                  <div key={item.id} className={`relative shrink-0 group ${item.type !== 'image' ? 'ring-2 ring-orange-500/50 rounded-2xl' : ''}`}>
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-black/20">
                      <img src={item.url} className="w-full h-full object-cover opacity-80" alt="" />
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                      <button onClick={() => moveItemInSequence('reels', i, 'left')} disabled={i === 0} className="p-1 bg-white/20 rounded-lg hover:bg-white/40 disabled:opacity-10"><ChevronLeft size={16}/></button>
                      <button onClick={() => moveItemInSequence('reels', i, 'right')} disabled={i === (data.reelsSequence?.length || 0) - 1} className="p-1 bg-white/20 rounded-lg hover:bg-white/40 disabled:opacity-10"><ChevronRight size={16}/></button>
                    </div>
                    <div className="absolute -top-2 -left-2 bg-orange-500 text-black text-[9px] font-black px-2 h-5 flex items-center justify-center rounded-lg shadow-md border-2 border-white dark:border-[#1E293B]">
                      {item.type === 'cover' ? 'CAPA' : item.type === 'closing' ? 'FIM' : i}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Timeline do Feed */}
            <section className="bg-white dark:bg-[#1E293B] p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base md:text-lg font-black dark:text-white uppercase flex items-center gap-3">
                  <LayoutGrid className="text-orange-500" size={20} /> Ordem do Feed
                </h2>
              </div>
              <div className="flex gap-3.5 overflow-x-auto pb-4 scrollbar-hide">
                {(data.feedSequence || []).map((item, i) => (
                  <div key={item.id} className="relative shrink-0 group">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-black/20">
                      <img src={item.url} className="w-full h-full object-cover opacity-80" alt="" />
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                      <button onClick={() => moveItemInSequence('feed', i, 'left')} disabled={i === 0} className="p-1 bg-white/20 rounded-lg hover:bg-white/40 disabled:opacity-10"><ChevronLeft size={16}/></button>
                      <button onClick={() => moveItemInSequence('feed', i, 'right')} disabled={i === (data.feedSequence?.length || 0) - 1} className="p-1 bg-white/20 rounded-lg hover:bg-white/40 disabled:opacity-10"><ChevronRight size={16}/></button>
                    </div>
                    <div className="absolute -top-2 -left-2 bg-orange-500 text-black text-[9px] font-black px-2 h-5 flex items-center justify-center rounded-lg shadow-md border-2 border-white dark:border-[#1E293B]">
                      {item.type === 'closing' ? 'ARTE' : i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Preview Visual */}
            <section>
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-lg font-black dark:text-white uppercase">Prévia do Carrossel</h2>
                 <button onClick={() => {
                   const zip = new JSZip();
                   const canvases = document.querySelectorAll('canvas');
                   let count = 0;
                   canvases.forEach((c) => {
                     if (c.width === 1080 && c.height === 1350) {
                        count++;
                        zip.file(`feed_${count}.png`, c.toDataURL('image/png').split(',')[1], {base64: true});
                     }
                   });
                   zip.generateAsync({type:"blob"}).then(blob => saveAs(blob, "carrossel_completo.zip"));
                 }} className="text-orange-500 font-black text-[10px] uppercase tracking-widest hover:underline">
                   Download ZIP Completo
                 </button>
              </div>
              <div id="feed-preview-container" className="flex gap-5 md:gap-8 overflow-x-auto pb-8 snap-x">
                {(data.feedSequence || []).map((item, i) => (
                  <div key={item.id} className="snap-start shrink-0">
                    <PostCanvas property={data} format={PostFormat.FEED} sequenceItem={item} isFirstInCarousel={i === 0} />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4">
             <section className="bg-gray-950 p-6 md:p-8 rounded-[2.5rem] shadow-2xl md:sticky md:top-32 border border-white/5">
               <h2 className="text-sm font-black text-white mb-6 uppercase tracking-widest text-center opacity-60">Prévia do Reels</h2>
               {!videoBlobUrl ? (
                 <>
                   <VideoReels ref={reelsRef} property={data} isRecording={recording} onRecordingComplete={onRecordingComplete} />
                   <div className="flex gap-3 mt-8">
                      <button onClick={() => reelsRef.current?.restart()} className="bg-white/5 text-white p-4 rounded-xl hover:bg-white/10 transition-colors">
                        <RefreshCcw size={20}/>
                      </button>
                      <button 
                        onClick={() => setRecording(true)} 
                        disabled={recording} 
                        className="flex-1 bg-orange-500 text-black font-black py-4 rounded-xl shadow-lg shadow-orange-500/10 hover:bg-orange-600 transition-all disabled:opacity-50 text-sm uppercase"
                      >
                        {recording ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Gravar Vídeo'}
                      </button>
                   </div>
                 </>
               ) : (
                 <div className="space-y-5 animate-in zoom-in-95 duration-300">
                    <div className="relative aspect-[9/16] bg-black rounded-3xl overflow-hidden border-[4px] border-orange-500/20 shadow-2xl">
                       <video src={videoBlobUrl} controls className="w-full h-full object-contain" />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                       <button onClick={() => saveAs(videoBlobUrl, `reels_imovel.webm`)} className="w-full bg-orange-500 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 text-sm uppercase tracking-tight">
                          <Download size={18} /> Baixar Vídeo
                       </button>
                       <button onClick={() => setVideoBlobUrl(null)} className="w-full bg-white/5 text-gray-500 font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-widest hover:text-white transition-colors">Refazer</button>
                    </div>
                 </div>
               )}
             </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-14 px-4 pb-32">
      <div className="mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">Novo Imóvel</h1>
        <p className="text-gray-500 font-bold text-sm">Preencha os dados ou deixe a IA analisar para você.</p>
      </div>
      
      <div className="space-y-6 md:space-y-8">
        {/* Link ou Texto */}
        <div className="bg-white dark:bg-[#1E293B] p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Análise Inteligente</label>
          <div className="flex flex-col md:flex-row gap-4">
            <textarea 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              placeholder="Cole o link do portal ou a descrição do imóvel para análise automática..." 
              className="flex-1 px-5 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl outline-none font-bold focus:ring-2 ring-orange-500 transition-all min-h-[120px] resize-none text-sm md:text-base border border-transparent dark:border-gray-800" 
            />
            <div className="flex flex-row md:flex-col gap-2 shrink-0">
               <button 
                onClick={handleAutoFill} 
                disabled={extracting} 
                className="flex-1 px-8 py-4 bg-orange-500 text-black font-black rounded-2xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 active:scale-95"
               >
                 {extracting ? <Loader2 size={24} className="animate-spin" /> : <BrainCircuit size={28} />}
               </button>
               <span className="hidden md:block text-[8px] font-black text-center text-gray-400 uppercase tracking-tighter">Analisar IA</span>
            </div>
          </div>
          {extracting && (
            <div className="mt-4 flex items-center gap-3 text-orange-500 animate-pulse">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">Extraindo metadados técnicos...</span>
            </div>
          )}
        </div>

        {/* Ficha Técnica */}
        <div className="bg-white dark:bg-[#1E293B] p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="md:col-span-2 flex items-center justify-between border-b border-gray-50 dark:border-gray-800 pb-5 mb-2">
            <h2 className="font-black uppercase text-orange-500 tracking-widest text-xs md:text-sm flex items-center gap-2">
              <Sparkles size={16} /> Ficha Técnica
            </h2>
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
              <button onClick={() => setNegotiation(NegotiationType.SELL)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${negotiation === NegotiationType.SELL ? 'bg-orange-500 text-black shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Venda</button>
              <button onClick={() => setNegotiation(NegotiationType.RENT)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${negotiation === NegotiationType.RENT ? 'bg-orange-500 text-black shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Aluga</button>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prefixo (Ex: CASA NO)</label>
            <input type="text" value={locationPrefix} onChange={(e) => setLocationPrefix(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 rounded-xl font-bold text-sm border border-transparent dark:border-gray-800" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preço</label>
            <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 rounded-xl font-black text-red-500 text-sm border border-transparent dark:border-gray-800" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bairro</label>
            <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 rounded-xl font-bold text-sm border border-transparent dark:border-gray-800" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cidade</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 rounded-xl font-bold text-sm border border-transparent dark:border-gray-800" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:col-span-2">
            <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Área m²</label><input type="text" value={area} onChange={(e) => setArea(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl font-bold text-sm text-center border border-transparent dark:border-gray-800" /></div>
            <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Quartos</label><input type="text" value={beds} onChange={(e) => setBeds(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl font-bold text-sm text-center border border-transparent dark:border-gray-800" /></div>
            <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Banhs</label><input type="text" value={baths} onChange={(e) => setBaths(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl font-bold text-sm text-center border border-transparent dark:border-gray-800" /></div>
            <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Vagas</label><input type="text" value={parking} onChange={(e) => setParking(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl font-bold text-sm text-center border border-transparent dark:border-gray-800" /></div>
          </div>
        </div>

        {/* Mídia */}
        <div className="bg-white dark:bg-[#1E293B] p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 space-y-8">
           <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 pb-5">
              <h2 className="font-black uppercase text-orange-500 tracking-widest text-xs md:text-sm flex items-center gap-2">
                <ArrowLeftRight size={16} /> Fotos do Imóvel
              </h2>
           </div>
           
           <div 
            onClick={() => fileInputRef.current?.click()} 
            className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-8 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-500/5 transition-all bg-gray-50 dark:bg-gray-900/40"
           >
              <input type="file" ref={fileInputRef} multiple accept="image/*" onChange={(e) => { const files = e.target.files; if (files) setUploadedImages(prev => [...prev, ...Array.from(files).map(f => URL.createObjectURL(f as any))]); }} className="hidden" />
              <Upload className="mx-auto text-orange-500 mb-3" size={28} />
              <p className="font-black uppercase text-[10px] tracking-widest text-gray-400">Carregar fotos do imóvel</p>
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {uploadedImages.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group shadow-md bg-black border border-gray-100 dark:border-gray-800">
                  <img src={img} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="" />
                  <div className="absolute top-2 right-2">
                    <button onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))} className="bg-red-500 text-white p-1 rounded-lg hover:scale-110 shadow-lg"><X size={12}/></button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-md">
                    #{i + 1}
                  </div>
                </div>
              ))}
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-50 dark:border-gray-800">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Capa (Reels)</label>
                <div onClick={() => reelsCoverArtInputRef.current?.click()} className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-center cursor-pointer aspect-square flex flex-col items-center justify-center overflow-hidden hover:border-orange-500 transition-colors">
                    <input type="file" ref={reelsCoverArtInputRef} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setReelsCoverArt(URL.createObjectURL(f as any)); }} />
                    {reelsCoverArt ? <img src={reelsCoverArt} className="h-full w-full object-contain rounded-xl" /> : <Upload className="text-gray-300 dark:text-gray-700" size={24} />}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Fim (Reels)</label>
                <div onClick={() => reelsClosingArtInputRef.current?.click()} className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-center cursor-pointer aspect-square flex flex-col items-center justify-center overflow-hidden hover:border-orange-500 transition-colors">
                    <input type="file" ref={reelsClosingArtInputRef} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setReelsClosingArt(URL.createObjectURL(f as any)); }} />
                    {reelsClosingArt ? <img src={reelsClosingArt} className="h-full w-full object-contain rounded-xl" /> : <Upload className="text-gray-300 dark:text-gray-700" size={24} />}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Fim (Feed)</label>
                <div onClick={() => feedClosingArtInputRef.current?.click()} className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-center cursor-pointer aspect-square flex flex-col items-center justify-center overflow-hidden hover:border-orange-500 transition-colors">
                    <input type="file" ref={feedClosingArtInputRef} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFeedClosingArt(URL.createObjectURL(f as any)); }} />
                    {feedClosingArt ? <img src={feedClosingArt} className="h-full w-full object-contain rounded-xl" /> : <Upload className="text-gray-300 dark:text-gray-700" size={24} />}
                </div>
              </div>
           </div>
        </div>

        {/* Gerar */}
        <div className="pt-4">
          <button 
            onClick={handleGenerate} 
            disabled={loading} 
            className="w-full bg-orange-500 text-black font-black py-4.5 md:py-5 rounded-[1.5rem] md:rounded-3xl text-base md:text-lg shadow-2xl hover:bg-orange-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98] uppercase tracking-tight"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
            {loading ? 'Preparando Prévia...' : 'Gerar Criativos'}
          </button>
        </div>
      </div>
    </div>
  );
};
