# Pages Store

A Zustand store for managing pages configuration data from the QuickVerse API.

## Features

- Fetch pages configuration by region ID
- Automatic authentication handling
- Loading and error state management
- Type-safe API integration

## API Endpoint

```
GET /v3/pages?regionId={regionId}
```

### Headers

- `Authorization: Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx`
- `Request-Origin: CAPTAIN`
- `SessionKey: {jwt}`
- `phone: {phone}`

## Usage

### Basic Usage

```typescript
import { usePages } from '../hooks/usePages';

const MyComponent = () => {
  const { pages, loading, error, fetchPages } = usePages();

  useEffect(() => {
    fetchPages('IIMU-313001');
  }, []);

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <View>
      {pages.map((page, index) => (
        <Text key={index}>{page.pageName}</Text>
      ))}
    </View>
  );
};
```

### Advanced Usage

```typescript
import { usePages } from '../hooks/usePages';

const MyComponent = () => {
  const { pages, loading, error, fetchPages, retryFetch, hasPages, getPageByName } = usePages();

  const handleRetry = () => {
    retryFetch('IIMU-313001');
  };

  const foodPage = getPageByName('Food');

  return (
    <View>
      {hasPages ? <Text>Found {pages.length} pages</Text> : <Text>No pages found</Text>}

      {foodPage && <Text>Food page has {foodPage.promotions.length} promotions</Text>}
    </View>
  );
};
```

## Store State

```typescript
interface PagesState {
  pages: Page[]; // Array of page configurations
  loading: boolean; // Loading state
  error: string | null; // Error message if any
}
```

## Store Actions

```typescript
interface PagesActions {
  fetchPages: (regionId: string, authSession: AuthSession) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}
```

## Hook Methods

### State

- `pages`: Array of page configurations
- `loading`: Boolean indicating if data is being fetched
- `error`: Error message string or null

### Actions

- `fetchPages(regionId)`: Fetch pages for a specific region
- `retryFetch(regionId)`: Retry fetching pages after an error
- `clearError()`: Clear the current error state
- `setError(message)`: Set a custom error message
- `setLoading(loading)`: Manually set loading state

### Computed Values

- `hasPages`: Boolean indicating if pages array has items
- `getPageByName(name)`: Helper function to find a page by name

## Data Structure

```typescript
interface Page {
  pageName: string; // Name of the page (e.g., "Food")
  posterLink: string; // Link to the page poster
  promotions: Promotion[]; // Array of promotions for this page
}

interface Promotion {
  shopId: string; // Shop identifier
  title: string; // Promotion title
  subtitle: string; // Promotion subtitle
  size: string; // Size of the promotion
  backgroundColor: string; // Background color
  isBannerImage: boolean; // Whether it's a banner image
  imageURL: string; // Image URL for the promotion
}
```

## Example Response

```json
[
  {
    "pageName": "Food",
    "posterLink": "FoodPosterLink",
    "promotions": [
      {
        "shopId": "4512",
        "title": "SomePromotion",
        "subtitle": "subtitle",
        "size": "Medium",
        "backgroundColor": "Red",
        "isBannerImage": false,
        "imageURL": ""
      }
    ]
  }
]
```

## Demo Component

See `src/components/common/pages/PagesDemo.tsx` for a complete example of how to use the pages store with a full UI implementation.
