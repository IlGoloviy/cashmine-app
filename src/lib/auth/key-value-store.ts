import * as SecureStore from 'expo-secure-store';

/** Native: Keychain (iOS) / Keystore-backed storage (Android). */
export const keyValueStore = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};
