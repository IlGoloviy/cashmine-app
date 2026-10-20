import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { QueryView } from '@/components/ui/query-view';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { maxAmount, validateClaimAmount } from '@/features/claims/amount';
import { isOutcomeUnknown } from '@/features/claims/outcome';
import type { DisplayBalance } from '@/features/claims/overlay';
import { useClaimOptionsQuery, useCreateClaimMutation } from '@/features/claims/queries';
import type { ClaimOptions, CreateClaimInput } from '@/features/claims/schemas';
import { useDisplayBalances } from '@/features/claims/use-display-balances';
import { useTheme } from '@/hooks/use-theme';
import { getErrorMessage, isApiError } from '@/lib/api';
import { confirm } from '@/lib/confirm';
import { newIdempotencyKey } from '@/lib/idempotency';
import { formatAmount, toBaseUnits } from '@/lib/money';

export default function ClaimScreen() {
  const params = useLocalSearchParams<{ asset?: string }>();
  const { query, display } = useDisplayBalances();
  const [asset, setAsset] = useState(params.asset);

  return (
    <Screen>
      <QueryView
        query={query}
        isEmpty={(d) => d.items.length === 0}
        empty={{ title: 'Nothing to claim' }}>
        {() => {
          const items = display?.items ?? [];
          const balance = items.find((b) => b.asset === asset);
          return (
            <>
              <Chips
                label="Asset"
                options={items.map((b) => ({ id: b.asset, label: b.asset }))}
                selected={asset}
                onSelect={setAsset}
              />
              {balance ? (
                <ClaimForm key={balance.asset} balance={balance} />
              ) : (
                <ThemedText themeColor="textSecondary">Pick an asset to claim.</ThemedText>
              )}
            </>
          );
        }}
      </QueryView>
    </Screen>
  );
}

function ClaimForm({ balance }: { balance: DisplayBalance }) {
  const options = useClaimOptionsQuery(balance.asset);
  return (
    <QueryView query={options}>
      {(data) => <ClaimFormBody balance={balance} options={data} />}
    </QueryView>
  );
}

/** One user intent = one key. Kept while the outcome is unknown so resends are idempotent. */
type Attempt = { input: CreateClaimInput; idempotencyKey: string };

function ClaimFormBody({ balance, options }: { balance: DisplayBalance; options: ClaimOptions }) {
  const theme = useTheme();
  const { asset, decimals } = balance;
  const [amountInput, setAmountInput] = useState('');
  const [destinationId, setDestinationId] = useState(options.destinations[0]?.id);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [touched, setTouched] = useState(false);
  // window.confirm + async state: a ref closes the double-tap window before re-render.
  const inFlight = useRef(false);
  const mutation = useCreateClaimMutation();

  const check = validateClaimAmount(amountInput, {
    asset,
    decimals,
    available: balance.available,
    minAmount: options.minAmount,
    fee: options.fee,
  });
  const unknown = attempt !== null && mutation.isError && isOutcomeUnknown(mutation.error);
  const locked = mutation.isPending || unknown;
  const serverFieldError =
    mutation.isError && isApiError(mutation.error) && mutation.error.field === 'amount'
      ? mutation.error.message
      : undefined;
  const amountError = (touched && !check.ok ? check.error : undefined) ?? serverFieldError;
  const canMax =
    toBaseUnits(balance.available, decimals) >= toBaseUnits(options.minAmount, decimals);
  const fmt = (amount: string) =>
    `${formatAmount(amount, { maxFractionDigits: decimals })} ${asset}`;
  const destination = options.destinations.find((d) => d.id === destinationId);

  const send = (next: Attempt) => {
    inFlight.current = true;
    setAttempt(next);
    mutation.mutate(next, {
      onSuccess: (claim) => router.replace({ pathname: '/claims/[id]', params: { id: claim.id } }),
      onError: (error) => {
        // Definitely rejected (4xx): the next submit is a new intent with a new key.
        if (!isOutcomeUnknown(error)) setAttempt(null);
      },
      onSettled: () => {
        inFlight.current = false;
      },
    });
  };

  const submit = async () => {
    setTouched(true);
    if (!check.ok || !destination || inFlight.current || locked) return;
    const ok = await confirm({
      title: `Claim ${fmt(check.amount)}?`,
      message: `Fee: ${fmt(options.fee)}\nYou receive: ${fmt(check.receive)}\nTo: ${destination.label}`,
      confirmText: 'Claim',
    });
    if (!ok || inFlight.current) return;
    send({
      input: { asset, amount: check.amount, destinationId: destination.id },
      idempotencyKey: newIdempotencyKey(),
    });
  };

  const resend = () => {
    if (attempt && !inFlight.current) send(attempt);
  };

  const startOver = async () => {
    const ok = await confirm({
      title: 'Start a new claim?',
      message:
        'Your previous claim may already have gone through. Check your balance first — ' +
        'starting over can create a second claim.',
      confirmText: 'Start over',
      destructive: true,
    });
    if (!ok) return;
    setAttempt(null);
    mutation.reset();
    router.replace('/');
  };

  return (
    <View style={styles.form}>
      <ThemedText type="small" themeColor="textSecondary">
        Available: {fmt(balance.available)}
        {balance.adjusted ? ' (includes your recent claim)' : ''}
      </ThemedText>

      <View style={styles.amountRow}>
        <View style={styles.flex}>
          <TextField
            label={`Amount (${asset})`}
            value={amountInput}
            onChangeText={(text) => {
              setAmountInput(text);
              if (mutation.isError && !unknown) mutation.reset();
            }}
            onBlur={() => setTouched(true)}
            editable={!locked}
            inputMode="decimal"
            keyboardType="decimal-pad"
            autoCorrect={false}
            placeholder={`Min ${options.minAmount}`}
            error={amountError}
          />
        </View>
        <Button
          title="Max"
          variant="secondary"
          style={styles.max}
          disabled={!canMax || locked}
          onPress={() => {
            setAmountInput(maxAmount(balance.available, decimals));
            setTouched(true);
          }}
        />
      </View>
      {!canMax ? (
        <ThemedText type="small" themeColor="textSecondary">
          Minimum claim is {fmt(options.minAmount)} — not enough available yet.
        </ThemedText>
      ) : null}

      {options.destinations.length === 0 ? (
        <ThemedText themeColor="danger">No payout destination is set up for {asset}.</ThemedText>
      ) : (
        <Chips
          label="Send to"
          options={options.destinations}
          selected={destinationId}
          onSelect={setDestinationId}
          disabled={locked}
        />
      )}

      <ThemedView type="backgroundElement" style={styles.summary}>
        <SummaryRow label="Amount" value={check.ok ? fmt(check.amount) : '—'} />
        <SummaryRow label="Fee" value={fmt(options.fee)} />
        <SummaryRow label="You receive" value={check.ok ? fmt(check.receive) : '—'} bold />
      </ThemedView>

      {unknown ? (
        <View style={[styles.banner, { borderColor: theme.danger }]} accessibilityRole="alert">
          <ThemedText type="smallBold">We couldn’t confirm your claim</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {unknownReason(mutation.error)} Your claim may already have gone through. “Check again”
            safely resends the same request — it will never create a second claim.
          </ThemedText>
          <Button title="Check again" onPress={resend} loading={mutation.isPending} />
          <Button title="Start over" variant="secondary" onPress={() => void startOver()} />
        </View>
      ) : (
        <>
          {mutation.isError && !serverFieldError ? (
            <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
              {claimErrorMessage(mutation.error)}
            </ThemedText>
          ) : null}
          <Button
            title={check.ok ? `Claim ${fmt(check.amount)}` : 'Claim'}
            onPress={() => void submit()}
            loading={mutation.isPending}
            disabled={!check.ok || !destination}
          />
        </>
      )}
    </View>
  );
}

function claimErrorMessage(error: unknown): string {
  if (isApiError(error) && error.code === 'IDEMPOTENCY_MISMATCH') {
    return 'This request conflicts with an earlier one. Go back to balances and try again.';
  }
  return getErrorMessage(error);
}

/** Why the outcome is unknown, without "please try again" (that could mean "claim again"). */
function unknownReason(error: unknown): string {
  if (isApiError(error)) {
    if (error.kind === 'network') return 'The connection dropped before the server answered.';
    if (error.kind === 'timeout' || error.status === 504) {
      return 'The server did not answer in time.';
    }
    if (error.kind === 'parse') return 'The server’s answer could not be read.';
  }
  return 'The server had a temporary problem.';
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.summaryLabel}>
        {label}
      </ThemedText>
      <ThemedText type={bold ? 'smallBold' : 'small'} style={styles.summaryValue}>
        {value}
      </ThemedText>
    </View>
  );
}

function Chips({
  label,
  options,
  selected,
  onSelect,
  disabled,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string | undefined;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.chipsBlock}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {options.map((option) => {
          const active = option.id === selected;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              aria-checked={active}
              aria-disabled={disabled}
              disabled={disabled}
              onPress={() => onSelect(option.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.tint : theme.backgroundElement,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}>
              <ThemedText type="smallBold" style={{ color: active ? theme.onTint : theme.text }}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  flex: { flex: 1 },
  amountRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  max: { marginTop: 24, paddingHorizontal: Spacing.three },
  summary: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  summaryLabel: { flexShrink: 0 },
  summaryValue: { flexShrink: 1, textAlign: 'right', fontVariant: ['tabular-nums'] },
  banner: { borderWidth: 1, borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  chipsBlock: { gap: Spacing.one },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
});
