import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { verifyToken } from '@/features/auth/api';
import { useTokenStatus } from '@/features/auth/use-token-status';
import { getErrorMessage, isApiError } from '@/lib/api';
import { clearToken, getSignOutReason, setToken } from '@/lib/auth/token-storage';

export default function TokenScreen() {
  const status = useTokenStatus();
  const [value, setValue] = useState('');
  const token = value.trim();

  const save = useMutation({
    mutationFn: async (candidate: string) => {
      await verifyToken(candidate);
      await setToken(candidate);
    },
    onSuccess: () => router.replace('/'),
  });

  const error = save.error
    ? isApiError(save.error) && save.error.isUnauthorized
      ? 'This token was rejected. Check it and try again.'
      : getErrorMessage(save.error)
    : undefined;

  return (
    <Screen>
      <View style={styles.intro}>
        <ThemedText type="smallBold">API token</ThemedText>
        <ThemedText themeColor="textSecondary">
          Paste the token from your task email. It is stored only in this browser.
        </ThemedText>
        {status === 'missing' && getSignOutReason() === 'rejected' ? (
          <ThemedText themeColor="danger">
            Your token was rejected or has expired. Enter a new one.
          </ThemedText>
        ) : null}
      </View>
      <TextField
        label="Token"
        value={value}
        onChangeText={setValue}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        secureTextEntry
        placeholder="Paste token"
        error={error}
        onSubmitEditing={() => token && save.mutate(token)}
      />
      <Button
        title="Save token"
        disabled={!token}
        loading={save.isPending}
        onPress={() => save.mutate(token)}
      />
      {status === 'present' ? (
        <>
          <Button title="Cancel" variant="secondary" onPress={() => router.replace('/')} />
          <Button title="Remove saved token" variant="danger" onPress={() => void clearToken()} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing.one },
});
