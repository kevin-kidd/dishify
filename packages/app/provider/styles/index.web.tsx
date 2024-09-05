// @ts-nocheck
import { useServerInsertedHTML } from "next/navigation";
import { StyleSheet } from "react-native";

export function StylesProvider({ children }: { children: React.ReactNode }) {
  useServerInsertedHTML(() => {
    const sheet = StyleSheet.getSheet();
    // biome-ignore lint/security/noDangerouslySetInnerHtml: we need to set the styles in the head for RSC
    return <style dangerouslySetInnerHTML={{ __html: sheet.textContent }} id={sheet.id} />;
  });
  return <>{children}</>;
}
