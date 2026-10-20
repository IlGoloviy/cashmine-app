/**
 * The one place the API base URL lives (the brief asks for it to be in code).
 * It is not a secret, so a fresh clone runs without any .env file.
 *
 * The API token is deliberately NOT here or in env: EXPO_PUBLIC_* values are inlined
 * into the deployed bundle. The user enters it at runtime (see lib/auth/token-storage).
 */
export const API_BASE_URL = 'https://task-api.cashmine.io';

export const env = {
  apiUrl: API_BASE_URL.replace(/\/+$/, ''),
};
