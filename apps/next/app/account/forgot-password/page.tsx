import { ForgotPasswordScreen } from "@dishify/app/features/account/forgot-password/screen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot password - Dishify",
  description: "Reset your Dishify account password quickly and securely.",
  openGraph: {
    title: "Forgot password - Dishify",
    description: "Reset your Dishify account password quickly and securely.",
    url: "https://dishify.app/account/forgot-password",
  },
};

export default function ForgotPassword() {
  return <ForgotPasswordScreen />;
}
