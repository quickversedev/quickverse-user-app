import collectionsService, { CollectionApi } from '../services/collectionsService';

export const API_STORE_ID = '68246';

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

export const fetchCollectionsFromApi = async (shopId: string): Promise<CollectionSection[]> => {
  try {
    const apiCollections = await collectionsService.fetchCollections(shopId);

    if (!apiCollections || apiCollections.length === 0) {
      return [];
    }

    const collections = apiCollections.map(mapApiCollection);

    return [
      {
        title: 'Collections',
        collections,
      },
    ];
  } catch (error) {
    console.warn('[CollectionsData] fetch failed:', error);
    return [];
  }
};
