import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { ActivityRow } from '@/features/activity/components/activity-row';
import { useActivityQuery } from '@/features/activity/queries';
import { getErrorMessage } from '@/lib/api';

export default function ActivityScreen() {
  const { query, items } = useActivityQuery();
  const refresh = () => void query.refetch();
  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError) {
      void query.fetchNextPage();
    }
  };

  // Same state machine as QueryView, adapted for an infinite query.
  if (query.isPending) return <LoadingView />;
  if (query.isError && !query.data) {
    return <ErrorView error={query.error} onRetry={refresh} />;
  }

  return (
    <Screen scroll={false}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ActivityRow item={item} />}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={refresh}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {query.isRefetchError ? (
              <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
                Couldn’t refresh: {getErrorMessage(query.error)}
              </ThemedText>
            ) : null}
            <Button
              title="Refresh"
              variant="secondary"
              loading={query.isRefetching && !query.isFetchingNextPage}
              onPress={refresh}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyView title="No activity yet" message="Payback and claims will show up here." />
        }
        ListFooterComponent={
          items.length === 0 ? undefined : (
            <View style={styles.footer}>
              {query.isFetchingNextPage ? (
                <ActivityIndicator />
              ) : query.isFetchNextPageError ? (
                <>
                  <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
                    Couldn’t load more: {getErrorMessage(query.error)}
                  </ThemedText>
                  <Button
                    title="Try again"
                    variant="secondary"
                    onPress={() => void query.fetchNextPage()}
                  />
                </>
              ) : query.hasNextPage ? (
                // onEndReached is unreliable on web: always offer an explicit button too.
                <Button title="Load more" variant="secondary" onPress={loadMore} />
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  That’s all your history.
                </ThemedText>
              )}
            </View>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.four },
  header: { paddingTop: Spacing.three, gap: Spacing.two },
  footer: { paddingVertical: Spacing.four, alignItems: 'center', gap: Spacing.two },
});
