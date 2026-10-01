/**
 * The coupon request always carries a region: the server rejects one without it, which left
 * Gevrai's cart with no coupons while its cached config had no region (Oct 2026).
 */
import couponService from './couponSevice';
import useConfigStore from '../../store/configStore';
import axiosInstance from '../../config/api/axios.config';
import { fetchInitialConfig } from './configService';

jest.mock('../../config/api/axios.config', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  apiCall: (p: Promise<{ data: unknown }>) => p.then(r => r.data),
  getAuthHeader: () => 'Basic test',
}));
jest.mock('./configService', () => ({ fetchInitialConfig: jest.fn() }));
jest.mock('../localStorage/storage.service', () => ({
  setRegionId: jest.fn(),
  getRegionId: jest.fn(),
}));
jest.mock('../../utils/cache', () => ({
  CACHE_TTL: { CONFIG: 4 * 60 * 60 * 1000 },
  isCacheFresh: (at: number, ttl: number) => Date.now() - at < ttl,
  createPersistedConfig: (name: string) => ({
    name,
    storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  }),
}));

const get = axiosInstance.get as jest.Mock;
const refetch = fetchInitialConfig as jest.Mock;
const GEVRAI = { latitude: '19.2607', longitude: '75.7528' };

beforeEach(() => {
  get.mockReset().mockResolvedValue({ data: { response: { data: [{ code: 'DE10' }] } } });
  refetch.mockReset();
});

const setConfig = (regionId: string | null) =>
  useConfigStore.setState({
    // A config fetched a minute ago: inside the 4-hour TTL.
    _lastFetchedAt: Date.now() - 60_000,
    config: {
      regionId,
      defaultLocation: GEVRAI,
      defaultThemeEnabled: false,
      themeId: '',
      deliveryDistance: 0,
    } as never,
  });

it('sends the region it is given', async () => {
  setConfig('BEED-431122');
  await couponService.getAvailableCoupons('BEED-431122', '98579', 'FOOD');

  expect(get).toHaveBeenCalledWith(
    '/v3/coupons/available',
    expect.objectContaining({
      params: { regionId: 'BEED-431122', serviceType: 'FOOD', shopId: '98579' },
    })
  );
  expect(refetch).not.toHaveBeenCalled();
});

it('refetches the config for the same place when the cached one has no region', async () => {
  setConfig(null);
  refetch.mockResolvedValue({ regionId: 'GEVRAI-431127', defaultLocation: GEVRAI });

  const coupons = await couponService.getAvailableCoupons(null, '113153', 'FOOD');

  expect(refetch).toHaveBeenCalledWith(GEVRAI);
  expect(get).toHaveBeenCalledWith(
    '/v3/coupons/available',
    expect.objectContaining({
      params: { regionId: 'GEVRAI-431127', serviceType: 'FOOD', shopId: '113153' },
    })
  );
  expect(coupons).toEqual([{ code: 'DE10' }]);
});

it('asks nothing when no region can be found at all', async () => {
  setConfig(null);
  refetch.mockResolvedValue({ regionId: null, defaultLocation: GEVRAI });

  expect(await couponService.getAvailableCoupons(null, '113153', 'FOOD')).toEqual([]);
  expect(get).not.toHaveBeenCalled();
});
