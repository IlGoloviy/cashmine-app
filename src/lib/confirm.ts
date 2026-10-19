import { Alert } from 'react-native';

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  destructive?: boolean;
};

/** Promise-based confirm. Native: Alert. Web version in confirm.web.ts (Alert is a no-op on web). */
export function confirm({ title, message, confirmText = 'Confirm', destructive }: ConfirmOptions) {
  return new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
