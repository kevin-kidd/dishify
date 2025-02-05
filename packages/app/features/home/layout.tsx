"use client";

import { ScrollView } from "react-native";
import Search from "./search";
import { Button, Div, H1, P, Section } from "@dishify/ui/src";
import { Link } from "solito/link";
import { ArrowLeft } from "lucide-react-native";
import ProfileButton from "../account/profile-button";
import { usePathname } from "solito/navigation";
import { useRouter } from "solito/navigation";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const router = useRouter();
  return (
    <ScrollView
      contentContainerStyle={{
        width: "100%",
        alignItems: "center",
      }}
      className="bg-gradient-to-b from-sage-50 to-sage-100 min-h-screen w-full pb-16 px-4 sm:px-8"
    >
      <Div className="flex flex-row items-center w-full justify-between pt-10 px-4 pb-0">
        <Div>
          {!isHome && (
            <Button onClick={() => router.back()} variant="none">
              <ArrowLeft className="w-6 h-6 text-sage-900" />
            </Button>
          )}
        </Div>

        <ProfileButton />
      </Div>
      <Section className="mb-6 sm:mb-12 text-center flex flex-col items-center justify-center gap-0 pt-8">
        <Link href="/">
          <H1 className="animate-fade-up text-5xl font-semibold tracking-tight my-0 py-0 text-sage-900">
            Dishify
          </H1>
        </Link>
        <P className="mt-4 animate-fade-up text-lg text-sage-800 animation-delay-100">
          Your AI-powered culinary companion
        </P>
      </Section>

      <Search />
      {children}
    </ScrollView>
  );
}
