import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { useTokenStatus } from '@/features/auth/use-token-status';
import { clearLocalClaims } from '@/features/claims/local-claims';
import { subscribeToken } from '@/lib/auth/token-storage';
import { createQueryClient, subscribeAppFocus } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // useState initializer: one client per app instance, survives re-renders and Fast Refresh.
  const [queryClient] = useState(createQueryClient);
  const tokenStatus = useTokenStatus();

  useEffect(() => subscribeAppFocus(), []);

  useEffect(() => {
    if (tokenStatus !== 'loading') SplashScreen.hideAsync();
  }, [tokenStatus]);

  // Data belongs to a token: drop every cached response when the token changes or is cleared.
  useEffect(
    () =>
      subscribeToken(() => {
        queryClient.clear();
        clearLocalClaims();
      }),
    [queryClient],
  );

  if (tokenStatus === 'loading') return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Protected guard={tokenStatus === 'present'} redirectTo="/token">
            <Stack.Screen name="index" options={{ title: 'CashMine' }} />
            <Stack.Screen name="claim" options={{ title: 'Claim payback' }} />
            <Stack.Screen name="claims/[id]" options={{ title: 'Claim status' }} />
          </Stack.Protected>
          <Stack.Screen name="token" options={{ title: 'API token' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
