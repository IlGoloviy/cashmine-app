import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { env } from '@/lib/env';

/** Placeholder — replaced by the first feature screen from the brief. */
export default function HomeScreen() {
  return (
    <Screen>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Ready</ThemedText>
        <ThemedText themeColor="textSecondary">API: {env.apiUrl}</ThemedText>
        <ThemedText themeColor="textSecondary">
          Token: {env.apiToken ? 'set via env' : 'not set'}
        </ThemedText>
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
});
