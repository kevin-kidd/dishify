import { ComponentProps } from "react";
import { SolitoImage } from "solito/image";
import { View } from "react-native";
import { ImageProps as NextImageProps } from "next/image";
import { ImageProps as RNImageProps } from "react-native";

type CommonImageProps = {
  className?: string;
  src: NextImageProps["src"] | RNImageProps["source"];
  alt?: string;
};

type ImageProps = CommonImageProps & Omit<ComponentProps<typeof SolitoImage>, "src">;

export function Image({ className, src, alt, ...rest }: ImageProps) {
  return (
    <View className={className}>
      <SolitoImage {...rest} src={src as any} alt={alt} />
    </View>
  );
}
