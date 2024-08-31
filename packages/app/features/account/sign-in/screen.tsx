import { H1, TextLink, P, Image } from "@dishify/ui";
import { SignInForm } from "./form";
import { OAuthButtons } from "../OAuthButtons";
import { View, ScrollView } from "react-native";

export function SignInScreen() {
  return (
    <View className="flex-1 flex-col items-center justify-center bg-background">
      <Image
        className="w-40 sm:w-48 2xl:w-56"
        alt="Dishify"
        width={400}
        height={200}
        src="/logo/logo-full.webp"
        contentFit="contain"
        priority
      />
      <H1 className="my-2 text-2xl font-bold 2xl:text-3xl text-center text-primary">
        Sign in to your account
      </H1>
      <P className="text-sm text-primary 2xl:text-base text-center">
        Don&apos;t have an account?{" "}
        <TextLink
          href="/account/sign-up"
          className="font-normal text-sm 2xl:text-base text-light-blue"
        >
          Sign up
        </TextLink>
      </P>
      <View className="w-full flex flex-col max-w-md gap-1 px-6 py-6 sm:px-0">
        <OAuthButtons />
        <SignInForm />
      </View>
    </View>
  );
}
