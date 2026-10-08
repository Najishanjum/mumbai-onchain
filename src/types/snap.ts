export type SnapReactionType = 'heart' | 'fire' | 'eyes' | 'clap';

export interface SnapReactions {
  heart: number;
  fire: number;
  eyes: number;
  clap: number;
}

export interface Snap {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: string;
  authorCity?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  eventId?: string;
  eventName?: string;
  date: string; // e.g. "Nov 4, 2026"
  caption?: string;
  location?: string; // e.g. "Jio World Centre, BKC"
  taggedPersonIds?: string[];
  reactions: SnapReactions;
  createdAt: string;
}

export interface CreateSnapInput {
  file?: File;
  imageDataUrl?: string;
  eventId?: string;
  eventName?: string;
  date: string;
  caption?: string;
  location?: string;
  taggedPersonIds?: string[];
}
