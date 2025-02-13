import type { SearchValues } from "@dishify/api/schemas/search";
import {
  Button,
  Dialog,
  Image,
  Text,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@dishify/ui";
import { type BaseSyntheticEvent, useMemo } from "react";
import type { UseFormWatch } from "react-hook-form";
import React from "react";

interface ImagePreviewProps {
  watch: UseFormWatch<SearchValues>;
  setImageData: (imageData: number[] | undefined) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e?: BaseSyntheticEvent) => Promise<void>;
}

export default function ImagePreview({
  watch,
  setImageData,
  isOpen,
  onOpenChange,
  onSubmit,
}: ImagePreviewProps) {
  const imageData = watch("image");
  const imageSrc = useMemo(() => {
    if (!imageData || imageData.length === 0) return null;
    const uint8Array = new Uint8Array(imageData);
    const blob = new Blob([uint8Array], { type: "image/png" });
    return URL.createObjectURL(blob);
  }, [imageData]);
  function handleConfirm() {
    onSubmit();
    onOpenChange(false);
  }
  function handleOpenChange(open: boolean) {
    if (!open) {
      setImageData(undefined);
    }
    onOpenChange(open);
  }
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex-1 w-full h-auto aspect-square sm:max-w-[425px] relative">
        <DialogHeader>
          <DialogTitle>Image Preview</DialogTitle>
          <DialogDescription>
            Confirm if this is the image you wish to search with.
          </DialogDescription>
        </DialogHeader>
        {imageSrc && (
          <>
            <Image
              src={imageSrc}
              alt="Image Preview"
              width={250}
              height={250}
              className="flex-1 w-full h-full object-contain rounded-sm"
            />
            <Button size="sm" className="flex self-end" onClick={handleConfirm}>
              <Text>Confirm</Text>
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
