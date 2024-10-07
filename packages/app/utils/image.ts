import { isWeb } from "@tamagui/constants";
import * as ImageManipulator from "expo-image-manipulator";
import { Image as RNImage } from "react-native";

export async function processImage(
  input: Blob | string | ImageData,
  setImageData: (imageData: number[] | undefined) => void,
  setIsPreviewOpen: (isOpen: boolean) => void,
): Promise<void> {
  const maxWidth = 800;
  const maxSizeInBytes = 1024 * 1024; // 1MB

  let blob: Blob;

  if (input instanceof Blob) {
    blob = input;
  } else if (typeof input === "string") {
    // Convert base64 string to Blob
    const response = await fetch(input);
    blob = await response.blob();
  } else if (input instanceof ImageData) {
    // Convert ImageData to Blob
    const canvas = document.createElement("canvas");
    canvas.width = input.width;
    canvas.height = input.height;
    const ctx = canvas.getContext("2d");
    ctx?.putImageData(input, 0, 0);
    blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else throw new Error("Failed to create blob");
      }),
    );
  } else {
    throw new Error("Unsupported input type");
  }

  try {
    let resizedImage = await resizeImage(blob, maxWidth, maxSizeInBytes);

    if (resizedImage.length > maxSizeInBytes) {
      // If still too large, try resizing to 400px width
      resizedImage = await resizeImage(blob, 400, maxSizeInBytes);

      if (resizedImage.length > maxSizeInBytes) {
        throw new Error("Image size is too large");
      }
    }

    setImageData(Array.from(resizedImage));
    setIsPreviewOpen(true);
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
}

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
