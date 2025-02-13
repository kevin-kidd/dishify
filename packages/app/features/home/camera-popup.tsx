import { Button, Dialog, DialogContent, DialogDescription, DialogTitle, Text } from "@dishify/ui";
import { isWeb } from "@tamagui/constants";
import { processImage } from "app/utils/image";
import { toast } from "app/utils/toast";
import { useRef } from "react";
import { Camera, type CameraType } from "react-camera-pro";
import { useMedia } from "app/utils/hooks/use-media";
import { useWindowDimensions } from "react-native";

interface CameraPopupProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  setIsPreviewOpen: (isOpen: boolean) => void;
  setImageData: (imageData: number[] | undefined) => void;
}

export default function CameraPopup({
  isOpen,
  onOpenChange,
  setIsPreviewOpen,
  setImageData,
}: CameraPopupProps) {
  const camera = useRef<CameraType>(null);
  const media = useMedia();
  const { width, height } = useWindowDimensions();

  // Calculate aspect ratio based on screen size and viewport
  const aspectRatio = isWeb
    ? media.sm || media.xxs
      ? 9 / 16 // Mobile viewport on web
      : media.md
        ? 4 / 3 // Tablet viewport
        : 16 / 9 // Desktop viewport
    : height / width; // Native mobile - use screen ratio

  // Convert ImageData or string to Uint8Array
  function convertImageDataToUint8Array(imageData: ImageData | string) {
    if (typeof imageData === "string") {
      return new Uint8Array(imageData.split(",").map((byte) => Number.parseInt(byte, 10)));
    }
    const { data, width, height } = imageData;
    const uint8Array = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      uint8Array[i] = data[i] ?? 0;
    }
    return uint8Array;
  }
  function takePhoto() {
    try {
      if (camera.current) {
        const image = camera.current.takePhoto();
        const promise = processImage(image, setImageData, setIsPreviewOpen);

        const id = toast.promise(promise, {
          loading: "Processing image...",
          success: () => toast.dismiss(id),
          error: "Error processing image",
        });
        onOpenChange(false);
        setImageData(Array.from(convertImageDataToUint8Array(image)));
      } else {
        throw new Error("No camera accessible");
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Unknown error");
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-full max-w-2xl p-0 border-none">
        <DialogTitle className="sr-only">Camera</DialogTitle>
        <DialogDescription className="sr-only">
          <Text>Take a photo of your dish</Text>
        </DialogDescription>
        <Camera
          ref={camera}
          aspectRatio={aspectRatio}
          facingMode="environment"
          errorMessages={{
            noCameraAccessible:
              "No camera device accessible. Please connect your camera or try a different browser.",
            permissionDenied: "Permission denied. Please refresh and give camera permission.",
            switchCamera:
              "It is not possible to switch camera to different one because there is only one video device accessible.",
            canvas: "Canvas is not supported.",
          }}
        />
        <Button size="sm" className="absolute bottom-3 right-3" onClick={takePhoto}>
          <Text>Confirm</Text>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
