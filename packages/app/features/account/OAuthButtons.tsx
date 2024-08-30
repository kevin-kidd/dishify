import {
  Button,
  GoogleIcon,
  IconProps,
  LinkedInIcon,
  ListItem,
  Tooltip,
  TooltipContent,
  TooltipGroup,
  TooltipTrigger,
  UnorderedList,
} from "@dishify/ui"

export function OAuthButtons() {
  return (
    <TooltipGroup>
      <UnorderedList className="flex flex-row gap-4 justify-center">
        <ListItem className="z-30">
          <OAuthButton
            Icon={GoogleIcon}
            onPress={() => console.log("XD")}
            label="Sign in with Google"
          />
        </ListItem>
        <ListItem className="z-20">
          <OAuthButton
            Icon={LinkedInIcon}
            onPress={() => console.log("XD")}
            label="Sign in with LinkedIn"
          />
        </ListItem>
      </UnorderedList>
    </TooltipGroup>
  )
}

function OAuthButton({
  onPress,
  Icon,
  label,
}: {
  onPress: () => void
  Icon: (props: IconProps) => JSX.Element
  label: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger delayDuration={300}>
        <Button
          aria-label={label}
          role="link"
          onPress={onPress}
          className="h-12 w-12 rounded-lg border border-border bg-background p-3 hover:bg-muted 2xl:h-14 2xl:w-14 2xl:p-[0.875rem]"
        >
          <Icon className="h-full w-full" />
        </Button>
      </TooltipTrigger>
      <TooltipContent position="top">{label}</TooltipContent>
    </Tooltip>
  )
}
