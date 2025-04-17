import { SignUpScreen } from "@dishify/app/features/account/sign-up/screen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up - Dishify",
  description:
    "Create a new Dishify account to unlock AI-powered recipe generation and smart shopping features.",
  openGraph: {
    title: "Sign up - Dishify",
    description:
      "Create a new Dishify account to unlock AI-powered recipe generation and smart shopping features.",
    url: "https://dishify.app/account/sign-up",
  },
};

export default function SignUp() {
  return <SignUpScreen />;
}
