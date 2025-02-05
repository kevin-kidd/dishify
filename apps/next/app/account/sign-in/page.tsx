import { SignInScreen } from "@dishify/app/features/account/sign-in/screen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dishify - Sign in",
  description: "Sign in to your account to get started",
};

export default function SignIn() {
  return <SignInScreen />;
}
