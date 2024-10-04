import { isWeb } from "@tamagui/constants";
import * as ImageManipulator from "expo-image-manipulator";
import { Image as RNImage } from "react-native";

export const resizeImage = async (
  imageData: Blob | string,
  maxWidth: number,
  maxSizeInBytes: number,
): Promise<Uint8Array> => {
  if (isWeb) {
    return resizeImageWeb(imageData as Blob, maxWidth, maxSizeInBytes);
  }
  return resizeImageMobile(imageData as string, maxWidth, maxSizeInBytes);
};

const resizeImageWeb = async (
  blob: Blob,
  maxWidth: number,
  maxSizeInBytes: number,
): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);

      // Start with high quality
      let quality = 0.9;
      const compressAndCheck = () => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              if (blob.size <= maxSizeInBytes) {
                blob.arrayBuffer().then((buffer) => {
                  resolve(new Uint8Array(buffer));
                });
              } else if (quality > 0.1) {
                // Reduce quality and try again
                quality -= 0.1;
                compressAndCheck();
              } else {
                reject(new Error("Unable to compress image to desired size"));
              }
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          "image/jpeg",
          quality,
        );
      };

      compressAndCheck();
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(blob);
  });
};

const resizeImageMobile = async (
  uri: string,
  maxWidth: number,
  maxSizeInBytes: number,
): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    RNImage.getSize(
      uri,
      async (width, height) => {
        const aspectRatio = width / height;

        const resizeAction = {
          resize: {
            width: Math.min(width, maxWidth),
            height: Math.round(Math.min(width, maxWidth) / aspectRatio),
          },
        };

        let quality = 1;
        let result: ImageManipulator.ImageResult;

        do {
          result = await ImageManipulator.manipulateAsync(uri, [resizeAction], {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
          });

          const response = await fetch(result.uri);
          const blob = await response.blob();

          if (blob.size <= maxSizeInBytes) {
            const arrayBuffer = await blob.arrayBuffer();
            resolve(new Uint8Array(arrayBuffer));
            return;
          }

          quality -= 0.1;
        } while (quality > 0.1);

        reject(new Error("Unable to compress image to desired size"));
      },
      (error) => reject(new Error(`Failed to get image size: ${error}`)),
    );
  });
};
