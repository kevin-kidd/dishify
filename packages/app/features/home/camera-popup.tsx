import { Button, Dialog, DialogContent, Text } from "@dishify/ui";
import { isWeb } from "@tamagui/constants";
import { processImage } from "app/utils/image";
import { toast } from "app/utils/toast";
import { useRef } from "react";
import { Camera, type CameraType } from "react-camera-pro";

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
      <DialogContent className="flex-1 w-screen max-w-2xl p-0">
        <Camera
          ref={camera}
          aspectRatio={isWeb ? 16 / 9 : 9 / 16}
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
        <Button size="sm" className="absolute bottom-3 right-3" onPress={takePhoto}>
          <Text>Confirm</Text>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
