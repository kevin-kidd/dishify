import { UpdatePasswordScreen } from "@dishify/app/features/account/update-password/screen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Update password - Dishify",
  description: "Update your Dishify account password to keep your account secure.",
  openGraph: {
    title: "Update password - Dishify",
    description: "Update your Dishify account password to keep your account secure.",
    url: "https://dishify.app/account/update-password",
  },
};

export default function UpdatePassword() {
  return <UpdatePasswordScreen />;
}
