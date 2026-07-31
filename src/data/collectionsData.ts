import collectionsService, { CollectionApi } from '../services/collectionsService';
import { storage } from '../services/localStorage/storage.service';

export const API_STORE_ID = '68246';

const COLLECTIONS_CACHE_TTL = 10 * 60 * 1000;
const MMKV_KEY_PREFIX = 'collections-cache-';

interface CacheEntry {
  sections: CollectionSection[];
  ts: number;
}

const memCache = new Map<string, CacheEntry>();

function readCache(shopId: string): CacheEntry | null {
  const mem = memCache.get(shopId);
  if (mem && Date.now() - mem.ts < COLLECTIONS_CACHE_TTL) return mem;

  try {
    const raw = storage.getString(MMKV_KEY_PREFIX + shopId);
    if (raw) {
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.ts < COLLECTIONS_CACHE_TTL) {
        memCache.set(shopId, entry);
        return entry;
      }
    }
  } catch {
    // corrupted — ignore
  }
  return null;
}

function writeCache(shopId: string, entry: CacheEntry) {
  memCache.set(shopId, entry);
  try {
    storage.set(MMKV_KEY_PREFIX + shopId, JSON.stringify(entry));
  } catch {}
}

export interface CollectionCategory {
  id: string;
  name: string;
}

export interface Collection {
  id: string;
  name: string;
  icon: string;
  image: string;
  section: string;
  categories: CollectionCategory[];
  productIds: string[];
}

export interface CollectionSection {
  title: string;
  collections: Collection[];
}

function mapApiCollection(api: CollectionApi): Collection {
  return {
    id: api.id,
    name: api.name,
    icon: api.icon || 'shape',
    image: api.image || '',
    section: 'Collections',
    categories: api.categories.map(c => ({ id: c.id, name: c.name })),
    productIds: [],
  };
}

export function getCachedCollections(shopId: string): Collection[] | null {
  const entry = readCache(shopId);
  if (entry && entry.sections.length > 0) {
    return entry.sections[0].collections;
  }
  return null;
}

export const fetchCollectionsFromApi = async (shopId: string): Promise<CollectionSection[]> => {
  const entry = readCache(shopId);
  if (entry) return entry.sections;

  try {
    const apiCollections = await collectionsService.fetchCollections(shopId);

    if (!apiCollections || apiCollections.length === 0) {
      return [];
    }

    const collections = apiCollections.map(mapApiCollection);

    const sections: CollectionSection[] = [
      {
        title: 'Collections',
        collections,
      },
    ];

    writeCache(shopId, { sections, ts: Date.now() });
    return sections;
  } catch (error) {
    console.error('[CollectionsData] fetch failed:', error);
    return [];
  }
};
