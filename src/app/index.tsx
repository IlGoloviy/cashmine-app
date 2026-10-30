import { Link, Stack } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { QueryView } from '@/components/ui/query-view';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { BalanceRow } from '@/features/balances/components/balance-row';
import { Freshness } from '@/features/balances/components/freshness';
import { totalUsd } from '@/features/balances/totals';
import { ClaimNotices } from '@/features/claims/components/claim-notices';
import { usePendingAttempt } from '@/features/claims/pending-attempt';
import { useDisplayBalances } from '@/features/claims/use-display-balances';
import { useTheme } from '@/hooks/use-theme';
import { getErrorMessage } from '@/lib/api';
import { formatUsd } from '@/lib/money';

export default function BalancesScreen() {
  const { query, display } = useDisplayBalances();
  const pending = usePendingAttempt();
  const theme = useTheme();
  const refresh = () => void query.refetch();

  return (
    <Screen scroll={false}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/token" asChild>
              <Pressable accessibilityRole="button" hitSlop={12} style={styles.headerButton}>
                <ThemedText type="linkPrimary">Token</ThemedText>
              </Pressable>
            </Link>
          ),
        }}
      />
      <QueryView
        query={query}
        isEmpty={(data) => data.items.length === 0}
        empty={{
          title: 'No balances yet',
          message: 'Payback you earn on exchanges shows up here.',
        }}>
        {() =>
          display ? (
            <FlatList
              data={display.items}
              keyExtractor={(item) => item.asset}
              renderItem={({ item }) => <BalanceRow balance={item} />}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl refreshing={query.isRefetching} onRefresh={refresh} />
              }
              ListHeaderComponent={
                <View style={styles.summary}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Total payback
                  </ThemedText>
                  <ThemedText style={styles.total} selectable>
                    {formatUsd(totalUsd(display.items))}
                  </ThemedText>
                  <Freshness asOf={display.asOf} />
                  <ClaimNotices />
                  {pending ? (
                    <View
                      style={[styles.pending, { borderColor: theme.danger }]}
                      accessibilityRole="alert">
                      <ThemedText type="smallBold">
                        Unconfirmed claim: {pending.input.amount} {pending.input.asset}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        We never got an answer for this claim. Check it before claiming again.
                      </ThemedText>
                      <Link
                        href={{ pathname: '/claim', params: { asset: pending.input.asset } }}
                        asChild>
                        <Button title="Check claim" />
                      </Link>
                    </View>
                  ) : null}
                  {query.isError ? (
                    <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
                      Couldn’t refresh: {getErrorMessage(query.error)}
                    </ThemedText>
                  ) : null}
                  {display.adjusted ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      Your recent claim is already reflected below; the next balance update will
                      confirm it.
                    </ThemedText>
                  ) : null}
                  <View style={styles.actions}>
                    <Button
                      title="Refresh"
                      variant="secondary"
                      loading={query.isFetching}
                      onPress={refresh}
                      style={styles.action}
                    />
                    <Link href="/activity" asChild>
                      <Button title="Activity" variant="secondary" style={styles.action} />
                    </Link>
                  </View>
                </View>
              }
            />
          ) : null
        }
      </QueryView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.three, gap: Spacing.three },
  summary: { gap: Spacing.two, marginBottom: Spacing.one },
  total: { fontSize: 36, lineHeight: 44, fontWeight: 700, fontVariant: ['tabular-nums'] },
  headerButton: { paddingHorizontal: Spacing.three },
  actions: { flexDirection: 'row', gap: Spacing.two },
  pending: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  action: { flex: 1 },
});
