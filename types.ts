
export enum PropertyType { HOUSE = 'CASA', APARTMENT = 'APARTAMENTO', LAND = 'TERRENO' }
export enum NegotiationType { SELL = 'VENDA', RENT = 'ALUGA' }
export enum PostFormat { FEED = 'FEED', REELS = 'REELS' }
export enum ImageFitMode { FILL = 'fill', FIT = 'fit' }
export interface SequenceItem { id: string; type: 'image' | 'cover' | 'closing'; url: string; }
export interface PropertyData {
  id: string; url: string; price: string; locationPrefix: string; neighborhood: string; city: string;
  type: PropertyType; negotiation: NegotiationType; area: string; beds: string; baths: string;
  parking: string; amenities: string[]; images: string[]; feedClosingArt?: string; 
  reelsClosingArt?: string; videoCover?: string; createdAt: string; imageFitMode?: ImageFitMode;
  audioUrl?: string; feedSequence?: SequenceItem[]; reelsSequence?: SequenceItem[];
}
