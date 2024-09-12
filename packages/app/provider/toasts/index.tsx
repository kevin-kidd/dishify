import { Toaster } from "sonner-native";

export function ToastProvider({ children }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
