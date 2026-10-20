import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { formatAmount, formatUsd, toBaseUnits } from '@/lib/money';

import type { Balance } from '../schemas';
import { assetUsd } from '../totals';

type Props = { balance: Balance & { adjusted?: boolean } };

export function BalanceRow({ balance }: Props) {
  const { asset, decimals } = balance;
  const fmt = (amount: string) => formatAmount(amount, { maxFractionDigits: decimals });
  const canClaim = toBaseUnits(balance.available, decimals) > 0n;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="smallBold">{asset}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatUsd(assetUsd(balance))}
        </ThemedText>
      </View>
      <View>
        <ThemedText type="small" themeColor="textSecondary">
          Available
        </ThemedText>
        <ThemedText style={styles.available} selectable>
          {fmt(balance.available)} {asset}
        </ThemedText>
      </View>
      <View style={styles.secondary}>
        <Detail label="Pending" value={`${fmt(balance.pending)}`} />
        <Detail label="Claiming" value={`${fmt(balance.claiming)}`} />
      </View>
      {balance.adjusted ? (
        <ThemedText type="small" themeColor="textSecondary">
          Includes your recent claim.
        </ThemedText>
      ) : null}
      <Link href={{ pathname: '/claim', params: { asset } }} asChild>
        <Button title={`Claim ${asset}`} variant="secondary" disabled={!canClaim} />
      </Link>
    </ThemedView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  available: { fontSize: 22, lineHeight: 28, fontWeight: 600, fontVariant: ['tabular-nums'] },
  secondary: { flexDirection: 'row', gap: Spacing.four },
  detail: { gap: Spacing.half },
});
