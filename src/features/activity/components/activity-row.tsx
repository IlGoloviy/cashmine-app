import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/format';
import { formatAmount } from '@/lib/money';

import type { ActivityItem } from '../schemas';

function title(item: ActivityItem): string {
  switch (item.type) {
    case 'accrual':
      return item.exchange ? `Payback from ${item.exchange}` : 'Payback';
    case 'reversal':
      return item.exchange ? `Reversed by ${item.exchange}` : 'Reversal';
    case 'claim':
      return 'Claim';
  }
}

const STATUS_LABEL: Record<ActivityItem['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  failed: 'Failed',
};

export function ActivityRow({ item }: { item: ActivityItem }) {
  const theme = useTheme();
  const negative = item.amount.startsWith('-');
  // A failed claim never left the balance: show it struck through, not as money moved.
  const failed = item.status === 'failed';
  const amountColor = failed ? theme.textSecondary : negative ? theme.text : theme.success;
  const statusColor =
    item.status === 'failed'
      ? theme.danger
      : item.status === 'pending'
        ? theme.textSecondary
        : theme.textSecondary;
  const amount = `${negative ? '' : '+'}${formatAmount(item.amount, { maxFractionDigits: 36 })} ${item.asset}`;
  // Only claims created through the API have a claim id we can open.
  const claimId = item.type === 'claim' ? item.relatedId : null;

  const content = (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <View style={styles.main}>
        <ThemedText type="smallBold">{title(item)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDateTime(item.createdAt)}
          {item.type === 'reversal' ? ' · takes back an earlier payback' : ''}
        </ThemedText>
      </View>
      <View style={styles.side}>
        <ThemedText
          type="smallBold"
          style={[styles.amount, { color: amountColor }, failed && styles.struck]}>
          {amount}
        </ThemedText>
        <ThemedText type="small" style={{ color: statusColor }}>
          {STATUS_LABEL[item.status]}
          {claimId ? ' ›' : ''}
        </ThemedText>
      </View>
    </View>
  );

  if (!claimId) return content;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${title(item)} ${amount}, ${STATUS_LABEL[item.status]}. Open claim`}
      onPress={() => router.push({ pathname: '/claims/[id]', params: { id: claimId } })}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  main: { flex: 1, gap: Spacing.half },
  side: { alignItems: 'flex-end', gap: Spacing.half, flexShrink: 1 },
  amount: { fontVariant: ['tabular-nums'], textAlign: 'right' },
  struck: { textDecorationLine: 'line-through' },
});
