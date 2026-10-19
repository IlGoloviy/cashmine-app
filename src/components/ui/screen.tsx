import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

type Props = {
  children: ReactNode;
  /** false for screens that render their own FlatList (lists must own scrolling). */
  scroll?: boolean;
} & Pick<ScrollViewProps, 'refreshControl'>;

/**
 * Mobile-first page container: full width on a phone, centred column on desktop
 * so the reviewer sees a phone-shaped app on any screen.
 */
export function Screen({ children, scroll = true, refreshControl }: Props) {
  if (!scroll) return <View style={[styles.column, styles.fill]}>{children}</View>;
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      contentContainerStyle={[styles.column, styles.content]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  column: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  content: { padding: Spacing.three, gap: Spacing.three },
});
