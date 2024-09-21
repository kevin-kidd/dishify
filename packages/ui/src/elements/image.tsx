import type { ComponentProps } from "react";
import { SolitoImage } from "solito/image";
import { View } from "react-native";
import type { ImageProps as NextImageProps } from "next/image";
import type { ImageProps as RNImageProps } from "react-native";
import type { ImageStyle } from "react-native";

type CommonImageProps = {
  className?: string;
  src: NextImageProps["src"] | RNImageProps["source"];
  alt?: string;
  style?: ImageStyle;
};

type ImageProps = CommonImageProps & Omit<ComponentProps<typeof SolitoImage>, "src">;

export function Image({ className, src, alt, style, fill = false, ...rest }: ImageProps) {
  return (
    <View className={className}>
      <SolitoImage {...rest} src={src as any} alt={alt} fill={fill} style={style} />
    </View>
  );
}
