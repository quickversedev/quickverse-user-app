import { GraphQLClient } from 'graphql-request';
import { API_CONFIG } from './axios.config';

/**
 * GraphQL transport config.
 *
 * The endpoint lives at the SERVER ROOT — `/graphql`, not `/quickVerse/v3/graphql`.
 * `/quickVerse` is a per-controller @RequestMapping prefix on the REST side, not a
 * servlet context path, and the Spring GraphQL controller declares no path. Deriving
 * the URL from API_CONFIG.baseURL means switching between prod and the local emulator
 * stays a ONE line change in axios.config.ts and moves both transports together.
 */
export const GRAPHQL_URL = `${API_CONFIG.baseURL.replace(/\/quickVerse\/?$/, '')}/graphql`;

/** Matches API_CONFIG.timeout. graphql-request has no timeout option — see searchGraphQLService. */
export const GRAPHQL_TIMEOUT = 15000;

/**
 * Cutover switch. Keep false until the server branch carrying the GraphQL search is
 * deployed — production has no /graphql endpoint, and search would break for everyone.
 *
 * Deliberately a checked-in constant rather than an @env var: there is no .env file in
 * this repo and react-native-dotenv runs with allowUndefined, so an @env flag would be
 * silently `undefined` for every developer. This mirrors how baseURL is already switched
 * by commented lines in axios.config.ts.
 */
export const SEARCH_GRAPHQL_ENABLED = false;

/**
 * Whether the deployed server accepts the `shopIds` argument.
 *
 * This is a separate flag because the query TEXT declares `$shopIds` — a server without
 * that argument rejects the whole document with HTTP 400 "Unknown argument", regardless
 * of whether a value is supplied. Lets the app run against an older server.
 */
export const SEARCH_GRAPHQL_SUPPORTS_SHOP_IDS = true;

export const graphqlClient = new GraphQLClient(GRAPHQL_URL);
