import { SignUpScreen } from "@dishify/app/features/account/sign-up/screen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dishify - Create a new account",
  description: "Create a new account to get started",
};

export default function SignUp() {
  return <SignUpScreen />;
}
