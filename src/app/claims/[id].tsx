import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { QueryView } from '@/components/ui/query-view';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useClaimQuery } from '@/features/claims/queries';
import type { Claim } from '@/features/claims/schemas';
import { useTheme } from '@/hooks/use-theme';
import { getErrorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { formatAmount } from '@/lib/money';

export default function ClaimStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useClaimQuery(id);

  return (
    <Screen>
      <QueryView query={query}>
        {(claim) => (
          <>
            <StatusCard claim={claim} />
            {query.isError ? (
              <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
                Couldn’t refresh the status: {getErrorMessage(query.error)}
              </ThemedText>
            ) : null}
            {claim.status === 'pending' || query.isError ? (
              <Button
                title="Refresh status"
                variant="secondary"
                loading={query.isFetching}
                onPress={() => void query.refetch()}
              />
            ) : null}
            <Button title="Back to balances" onPress={() => router.dismissTo('/')} />
          </>
        )}
      </QueryView>
    </Screen>
  );
}

const STATUS_COPY: Record<Claim['status'], { title: string; body: string }> = {
  pending: {
    title: 'Claim in progress',
    body: 'This usually takes about 20 seconds. You can leave this screen — the claim continues.',
  },
  completed: { title: 'Claim completed', body: 'The payback is on its way to your destination.' },
  failed: {
    title: 'Claim failed',
    body: 'Nothing was sent. The amount is back in your available balance.',
  },
};

function StatusCard({ claim }: { claim: Claim }) {
  const theme = useTheme();
  const copy = STATUS_COPY[claim.status];
  const color =
    claim.status === 'completed'
      ? theme.success
      : claim.status === 'failed'
        ? theme.danger
        : theme.text;
  const fmt = (amount: string) =>
    `${formatAmount(amount, { maxFractionDigits: 36 })} ${claim.asset}`;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.statusRow} accessibilityLiveRegion="polite">
        {claim.status === 'pending' ? <ActivityIndicator /> : null}
        <ThemedText type="smallBold" style={{ color }}>
          {copy.title}
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {copy.body}
      </ThemedText>
      {claim.status === 'failed' && claim.failureReason ? (
        <ThemedText type="small" themeColor="danger">
          Reason: {claim.failureReason}
        </ThemedText>
      ) : null}
      <View style={styles.rows}>
        <Row label="Amount" value={fmt(claim.amount)} />
        <Row label="Fee" value={fmt(claim.fee)} />
        <Row label="You receive" value={fmt(claim.receiveAmount)} bold />
        <Row label="Created" value={formatDateTime(claim.createdAt)} />
        <Row label="Updated" value={formatDateTime(claim.updatedAt)} />
        <Row label="Claim ID" value={claim.id} />
      </View>
    </ThemedView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type={bold ? 'smallBold' : 'small'} style={styles.value} selectable>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rows: { gap: Spacing.two, marginTop: Spacing.two },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  value: { flexShrink: 1, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
