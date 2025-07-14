# Address Management Store

This directory contains the Zustand store and custom hook for managing address data in the application.

## Files

- `addressStore.ts` - Zustand store for address state management
- `../hooks/useAddress.ts` - Custom hook that provides a clean interface to the address store
- `../types/address.ts` - TypeScript types for address-related data

## Usage

### Using the Hook (Recommended)

```typescript
import { useAddress } from '../hooks/useAddress';

const MyComponent = () => {
  const { addresses, loading, error, addAddress, retryFetch } = useAddress();

  // The hook automatically fetches addresses on mount
  // You can use the returned values directly in your component
};
```

### Using the Store Directly

```typescript
import useAddressStore from '../store/addressStore';

const MyComponent = () => {
  const { addresses, loading, error, fetchAddresses } = useAddressStore();

  // Manual fetch
  useEffect(() => {
    fetchAddresses();
  }, []);
};
```

## Features

- **Automatic Fetching**: The `useAddress` hook automatically fetches addresses when the component mounts
- **Error Handling**: Built-in error handling with retry functionality
- **Loading States**: Loading states for better UX
- **Type Safety**: Full TypeScript support with proper type definitions
- **Optimistic Updates**: The store handles API calls and state updates automatically

## API Methods

### useAddress Hook

- `addresses` - Array of user addresses
- `loading` - Boolean indicating if a request is in progress
- `error` - Error message if any request failed
- `addAddress(newAddress)` - Add a new address
- `retryFetch()` - Retry the last failed request
- `hasAddresses` - Boolean indicating if user has any addresses
- `defaultAddress` - The default address if any

### Store Actions

- `fetchAddresses()` - Fetch all addresses from the API
- `addAddress(newAddress)` - Add a new address
- `setLoading(loading)` - Manually set loading state
- `setError(error)` - Manually set error state
- `clearError()` - Clear the current error

## Types

```typescript
type AddressDetails = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3?: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  tag: string;
  latitude?: string;
  longitude?: string;
};

type NewAddress = AddressDetails & {
  isDefaultAddress?: boolean;
};

type Address = {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  pincode?: string;
  tag?: string;
};
```

## API Format

The store sends data to the API in the following format:

```json
{
  "address": {
    "name": "Abhilash",
    "addressLine1": "Ground Floor, Rome BLR26, Baghmane Constellation",
    "addressLine2": "Mahadevapura",
    "addressLine3": null,
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560048",
    "latitude": "12.9851",
    "longitude": "77.7041",
    "tag": "Home"
  },
  "isDefaultAddress": false
}
```
