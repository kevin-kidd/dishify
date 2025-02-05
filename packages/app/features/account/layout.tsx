"use client";

import { ScrollView } from "react-native";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      contentContainerStyle={{
        width: "100%",
        alignItems: "center",
      }}
      className="bg-gradient-to-b from-sage-50 to-sage-100 min-h-screen w-full"
    >
      {children}
    </ScrollView>
  );
}
