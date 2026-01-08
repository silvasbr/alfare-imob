
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
        const pref = (extracted.type === PropertyType.APARTMENT || (extracted.type as string) === 'APARTAMENTO') ? 'APTO NO' : 'CASA NO';
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'images' | 'feedClosing' | 'reelsClosing' | 'reelsCover') => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (target === 'images') setUploadedImages(prev => [...prev, result]);
        else if (target === 'feedClosing') setFeedClosingArt(result);
        else if (target === 'reelsClosing') setReelsClosingArt(result);
        else if (target === 'reelsCover') setReelsCoverArt(result);
      };
      reader.readAsDataURL(file);
    });
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

            <section>
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-lg font-black dark:text-white uppercase">Prévia do Carrossel</h2>
                 <button onClick={() => {
                   const zip = new JSZip();
                   const canvases = document.querySelectorAll('canvas');
                   let count = 0;
                   // Use Array.from and cast to HTMLCanvasElement to avoid type errors
                   Array.from(canvases).forEach((c) => {
                     const canvas = c as HTMLCanvasElement;
                     if (canvas.width === 1080 && canvas.height === 1350) {
                        count++;
                        zip.file(`feed_${count}.png`, canvas.toDataURL('image/png').split(',')[1], {base64: true});
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

  // Handle Input Step UI
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 animate-in fade-in duration-500 pb-24">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black uppercase tracking-tight dark:text-white">Detalhes do Imóvel</h1>
      </header>

      <div className="space-y-8">
        <section className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Descrição ou Link do Anúncio</label>
          <div className="flex flex-col md:flex-row gap-3">
            <textarea 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Cole aqui o texto ou link do anúncio para extração automática..."
              className="flex-1 p-4 bg-gray-50 dark:bg-[#0F172A] border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none text-sm font-medium transition-all min-h-[100px] resize-none dark:text-white"
            />
            <button 
              onClick={handleAutoFill}
              disabled={extracting}
              className="md:w-48 bg-gray-900 dark:bg-gray-800 text-white font-black py-4 px-6 rounded-2xl hover:bg-orange-500 hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {extracting ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
              <span className="text-xs uppercase">IA Auto-Fill</span>
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Localização e Preço</h3>
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Preço</label>
              <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="R$ 0,00" className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] rounded-xl border-none outline-none font-bold text-sm dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Bairro</label>
                <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] rounded-xl border-none outline-none font-bold text-sm dark:text-white" />
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Cidade</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] rounded-xl border-none outline-none font-bold text-sm dark:text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-2">Tipo e Negócio</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tipo</label>
                <select value={type} onChange={(e) => setType(e.target.value as PropertyType)} className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] rounded-xl border-none outline-none font-bold text-sm dark:text-white appearance-none">
                  <option value={PropertyType.HOUSE}>CASA</option>
                  <option value={PropertyType.APARTMENT}>APARTAMENTO</option>
                  <option value={PropertyType.LAND}>TERRENO</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Negócio</label>
                <select value={negotiation} onChange={(e) => setNegotiation(e.target.value as NegotiationType)} className="w-full p-3 bg-gray-50 dark:bg-[#0F172A] rounded-xl border-none outline-none font-bold text-sm dark:text-white appearance-none">
                  <option value={NegotiationType.SELL}>VENDA</option>
                  <option value={NegotiationType.RENT}>ALUGUEL</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
           <h3 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-6">Mídias do Anúncio</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button onClick={() => fileInputRef.current?.click()} className="aspect-square bg-gray-50 dark:bg-[#0F172A] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-2 hover:border-orange-500 transition-all">
                <Upload size={24} className="text-gray-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Fotos Imóvel</span>
                <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => handleImageUpload(e, 'images')} />
              </button>
              
              <button onClick={() => reelsCoverArtInputRef.current?.click()} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${reelsCoverArt ? 'border-green-500 bg-green-500/5' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A]'}`}>
                {reelsCoverArt ? <CheckCircle2 size={24} className="text-green-500" /> : <Star size={24} className="text-gray-400" />}
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center px-2">Capa Inicial Reels</span>
                <input ref={reelsCoverArtInputRef} type="file" hidden onChange={(e) => handleImageUpload(e, 'reelsCover')} />
              </button>

              <button onClick={() => feedClosingArtInputRef.current?.click()} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${feedClosingArt ? 'border-green-500 bg-green-500/5' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A]'}`}>
                {feedClosingArt ? <CheckCircle2 size={24} className="text-green-500" /> : <Layers size={24} className="text-gray-400" />}
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center px-2">Arte Final Feed</span>
                <input ref={feedClosingArtInputRef} type="file" hidden onChange={(e) => handleImageUpload(e, 'feedClosing')} />
              </button>

              <button onClick={() => reelsClosingArtInputRef.current?.click()} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${reelsClosingArt ? 'border-green-500 bg-green-500/5' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A]'}`}>
                {reelsClosingArt ? <CheckCircle2 size={24} className="text-green-500" /> : <Clapperboard size={24} className="text-gray-400" />}
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 text-center px-2">Arte Final Reels</span>
                <input ref={reelsClosingArtInputRef} type="file" hidden onChange={(e) => handleImageUpload(e, 'reelsClosing')} />
              </button>
           </div>
           
           {uploadedImages.length > 0 && (
             <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
               {uploadedImages.map((img, i) => (
                 <div key={i} className="relative group shrink-0">
                    <img src={img} className="w-16 h-16 object-cover rounded-xl" />
                    <button onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100">
                      <X size={12} />
                    </button>
                 </div>
               ))}
             </div>
           )}
        </section>

        <button 
          onClick={handleGenerate}
          disabled={loading || uploadedImages.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 text-black font-black py-5 rounded-[2rem] shadow-2xl shadow-orange-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
          GERAR PREVIEW E CONTEÚDO
        </button>
      </div>
    </div>
  );
};
