import { TextLink, P, Image, Main, Section, Text } from "@dishify/ui";
import { SignUpForm } from "./form";
import { OAuthButtons } from "../OAuthButtons";
import AccountLayout from "../layout";

export function SignUpScreen() {
  return (
    <AccountLayout>
      <Main className="flex flex-col min-h-screen items-center gap-0 justify-center max-w-xl w-full container mx-auto">
        <Image
          className="w-32 sm:w-40 2xl:w-48 mx-auto"
          width={400}
          height={200}
          alt="Dishify"
          src="/logo-large.png"
          priority
          contentFit="contain"
          fill={false}
        />
        <Text className="mt-6 text-2xl font-bold 2xl:text-3xl text-center text-foreground">
          Create a new account
        </Text>
        <P className="text-sm text-sage-700 2xl:text-base text-center py-0">
          Already have an account?{" "}
          <TextLink
            href="/account/sign-in"
            className="font-normal text-sm 2xl:text-base text-sage-500 hover:text-sage-600 transition-colors"
          >
            Sign in
          </TextLink>
        </P>
        <Section className="w-full flex flex-col gap-1 px-6 py-4 sm:px-0">
          <OAuthButtons />
          <SignUpForm />
        </Section>
      </Main>
    </AccountLayout>
  );
}
