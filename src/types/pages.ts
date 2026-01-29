export interface Promotion {
  shopId: string;
  title: string;
  subtitle: string;
  size: string;
  backgroundColor: string;
  bannerImage: boolean;
  imageURL: string | number;
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
}

export interface PagesActions {
  fetchPages: (regionId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  getPageById: (pageId: string) => Page | undefined;
}

export type PagesStore = PagesState & PagesActions;
