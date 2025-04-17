import { SignInScreen } from "@dishify/app/features/account/sign-in/screen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in - Dishify",
  description:
    "Sign in to your Dishify account to access personalized recipes, favorites, and more.",
  openGraph: {
    title: "Sign in - Dishify",
    description:
      "Sign in to your Dishify account to access personalized recipes, favorites, and more.",
    url: "https://dishify.app/account/sign-in",
  },
};

export default function SignIn() {
  return <SignInScreen />;
}
