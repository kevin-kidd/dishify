import { H1, P, TextLink, Card, Button, Text, Separator } from "@dishify/ui"
import { View, ScrollView } from "react-native"
import { Link } from "solito/link"

export function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 items-center justify-center p-3 bg-background space-y-4">
        <H1>Welcome to Solito.</H1>
        <View className="max-w-xl mb-4">
          <P className="text-center">
            Here is a basic starter to show you how you can navigate from one screen to another.
            This screen uses the same code on Next.js and React Native.
          </P>
          <P className="text-center">
            Solito is made by{" "}
            <TextLink href="https://twitter.com/fernandotherojo" target="_blank" rel="noreferrer">
              Fernando Rojo
            </TextLink>
            .
          </P>
          <P className="text-center hover:text-red-500">
            NativeWind is made by{" "}
            <TextLink
              href="https://twitter.com/mark__lawlor"
              target="_blank"
              rel="noreferrer"
              className="text-center hover:text-red-500"
            >
              Mark Lawlor
            </TextLink>
            .
          </P>
        </View>
        <Link href="/account/sign-in">
          <Button variant="outline" size="lg">
            <Text>Sign In</Text>
          </Button>
        </Link>
      </View>
    </ScrollView>
  )
}
