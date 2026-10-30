import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatAmount } from '@/lib/money';

import { dismissClaimNotice, useClaimNotices } from '../local-claims';
import type { Claim } from '../schemas';

/** Claims that settled while the user was elsewhere — never let a result go unseen. */
export function ClaimNotices() {
  const notices = useClaimNotices();
  if (notices.length === 0) return null;
  return (
    <View style={styles.list}>
      {notices.map((claim) => (
        <ClaimNotice key={claim.id} claim={claim} />
      ))}
    </View>
  );
}

function ClaimNotice({ claim }: { claim: Claim }) {
  const theme = useTheme();
  const failed = claim.status === 'failed';
  const amount = formatAmount(claim.amount, { symbol: claim.asset });
  return (
    <View
      style={[styles.notice, { borderColor: failed ? theme.danger : theme.success }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite">
      <ThemedText type="smallBold">
        {failed ? `Claim of ${amount} failed` : `Claim of ${amount} completed`}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {failed
          ? `${claim.failureReason ? `${claim.failureReason}. ` : ''}The amount is back in your available balance — nothing was sent.`
          : `${formatAmount(claim.receiveAmount, { symbol: claim.asset })} is on its way to your destination.`}
      </ThemedText>
      <View style={styles.actions}>
        <Link href={{ pathname: '/claims/[id]', params: { id: claim.id } }} asChild>
          <Button title="View claim" variant="secondary" style={styles.action} />
        </Link>
        <Button
          title="Dismiss"
          variant="secondary"
          style={styles.action}
          onPress={() => dismissClaimNotice(claim.id)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  notice: { borderWidth: 1, borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  actions: { flexDirection: 'row', gap: Spacing.two },
  action: { flex: 1 },
});
