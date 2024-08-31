import type { ComponentProps } from "react";
import { SolitoImage } from "solito/image";
import { View } from "react-native";
import type { ImageProps as NextImageProps } from "next/image";
import type { ImageProps as RNImageProps } from "react-native";

type CommonImageProps = {
  className?: string;
  src: NextImageProps["src"] | RNImageProps["source"];
  alt?: string;
};

type ImageProps = CommonImageProps & Omit<ComponentProps<typeof SolitoImage>, "src">;

export function Image({ className, src, alt, fill = false, ...rest }: ImageProps) {
  return (
    <View className={className}>
      <SolitoImage {...rest} src={src as any} alt={alt} fill={fill} />
    </View>
  );
}
