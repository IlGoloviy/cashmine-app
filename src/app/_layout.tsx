import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { createQueryClient, subscribeAppFocus } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // useState initializer: one client per app instance, survives re-renders and Fast Refresh.
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    SplashScreen.hideAsync();
    return subscribeAppFocus();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="index" options={{ title: 'CashMine' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
