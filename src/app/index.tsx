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
import { useDisplayBalances } from '@/features/claims/use-display-balances';
import { getErrorMessage } from '@/lib/api';
import { formatUsd } from '@/lib/money';

export default function BalancesScreen() {
  const { query, display } = useDisplayBalances();
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
                  <Button
                    title="Refresh"
                    variant="secondary"
                    loading={query.isFetching}
                    onPress={refresh}
                  />
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
});
