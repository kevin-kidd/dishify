import { appColorSchemeAtom } from "app/atoms/theme";
import { useAtomValue } from "jotai";
import { Toaster } from "sonner";
import React from "react";

export function ToastProvider({ children }) {
  const appColorScheme = useAtomValue(appColorSchemeAtom);
  return (
    <>
      {children}
      <Toaster position="bottom-right" theme={appColorScheme} closeButton />
    </>
  );
}
