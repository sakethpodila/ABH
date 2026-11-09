import type { Preparation } from './types';

export interface MenuOption {
  sizeLabel: string;
  preparation: Preparation;
  pricePaise: number;
}

export interface MenuDraft {
  id: string;
  name: string;
  category: string;
  description: string;
  imagePath: string | null;
  revision: string;
  status: 'draft' | 'published';
  tags: string[];
  options: MenuOption[];
}

export interface MenuSummary {
  id: string;
  name: string;
  category: string;
  status?: 'draft' | 'published';
  revision?: string;
}

export interface PublicMenuProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string | null;
  tags: string[];
  options: MenuOption[];
}
