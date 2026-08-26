export interface Promotion {
  shopId: string;
  title: string;
  subtitle: string;
  size: string;
  backgroundColor: string;
  bannerImage: boolean;
  imageURL: string | number;
  /** Sent by the server's PromotionResponseDTO; used as the carousel's React key. */
  promoId?: number;
  sequence?: number;
  timeSlot?: 'MORNING' | 'AFTERNOON' | 'NIGHT' | null;
}

export interface Page {
  pageName: string;
  posterLink: string;
  promotion: Promotion[];
}

export interface PagesState {
  pages: Page[];
  loading: boolean;
  error: string | null;
  _lastFetchedAt: number;
  /** Region the cached pages belong to. Freshness alone is not enough — see fetchPages. */
  _cachedRegionId: string | null;
}

export interface PagesActions {
  fetchPages: (regionId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;

  getPageById: (pageId: string) => Page | undefined;
}

export type PagesStore = PagesState & PagesActions;
