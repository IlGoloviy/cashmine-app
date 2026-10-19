import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { env } from '@/lib/env';

/** Placeholder — replaced by the first feature screen from the brief. */
export default function HomeScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Ready</ThemedText>
        <ThemedText themeColor="textSecondary">API: {env.apiUrl}</ThemedText>
        <ThemedText themeColor="textSecondary">
          Token: {env.apiToken ? 'set via env' : 'not set'}
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.three },
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
});
