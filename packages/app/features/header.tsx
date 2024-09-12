import { Button, Div, Image, LI, Nav, Text, TextLink, UL } from "@dishify/ui/src";
import { Link } from "solito/link";

export function Header() {
  return (
    <Div className="bg-background">
      <Nav className="flex flex-row items-center justify-between container mx-auto py-6">
        <Link href="/">
          <Image
            src="/logo-icon.png"
            alt="Dishify"
            width={100}
            height={100}
            className="w-10 h-10 hover:opacity-90 transition-opacity"
          />
        </Link>
        <UL className="flex flex-row items-center gap-10">
          <LI>
            <TextLink
              href="/explore"
              className="text-muted-foreground font-medium transition-colors hover:text-foreground"
            >
              Explore
            </TextLink>
          </LI>
          <LI>
            <TextLink
              href="/create"
              className="text-muted-foreground font-medium transition-colors hover:text-foreground"
            >
              Create
            </TextLink>
          </LI>
          <LI>
            <Link href="/sign-in">
              <Button>
                <Text>Sign In</Text>
              </Button>
            </Link>
          </LI>
        </UL>
      </Nav>
    </Div>
  );
}
