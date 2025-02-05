import { ForgotPasswordScreen } from "@dishify/app/features/account/forgot-password/screen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dishify - Forgot password",
  description: "Forgot your password? Reset it here",
};

export default function ForgotPassword() {
  return <ForgotPasswordScreen />;
}
