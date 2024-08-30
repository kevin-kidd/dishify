import { ComponentProps } from "react"
import { SolitoImage } from "solito/image"
import { View } from "react-native"

export function Image({
  className,
  ...rest
}: ComponentProps<typeof SolitoImage> & { className: string }) {
  return (
    <View className={className}>
      <SolitoImage {...rest} />
    </View>
  )
}
