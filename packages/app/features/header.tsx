import { Button, Div, Image, LI, Nav, Text, TextLink, UL } from "@dishify/ui/src";
import { Link } from "solito/link";

export function Header() {
  return (
    <Div className="bg-background">
      <Nav className="flex flex-row items-center justify-between container mx-auto">
        <Link href="/">
          <Image src="/logo.png" alt="Dishify" width={100} height={100} />
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
            <Button variant="default">
              <Text>Sign In</Text>
            </Button>
          </LI>
        </UL>
      </Nav>
    </Div>
  );
}
