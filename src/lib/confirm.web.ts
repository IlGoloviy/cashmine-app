type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  destructive?: boolean;
};

/** react-native-web's Alert.alert does nothing — fall back to the browser dialog. */
export async function confirm({ title, message }: ConfirmOptions): Promise<boolean> {
  return window.confirm(message ? `${title}\n\n${message}` : title);
}
