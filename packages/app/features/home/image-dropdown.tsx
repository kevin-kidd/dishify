import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@dishify/ui";
import { ImageIcon } from "@dishify/ui/src/icons/image";
import { CameraIcon } from "@dishify/ui/src/icons/camera";
import { UploadIcon } from "lucide-react-native";
import { Button, Text } from "@dishify/ui/src";
import { isWeb } from "@tamagui/constants";
import * as ImagePicker from "expo-image-picker";
import { type BaseSyntheticEvent, useRef, useState } from "react";
import ImagePreview from "./image-preview";
import type { SearchValues } from "@dishify/api/schemas/search";
import type { UseFormWatch } from "react-hook-form";
import { toast } from "app/utils/toast";
import { processImage } from "app/utils/image";
import CameraPopup from "./camera-popup";

interface ImageDropdownProps {
  setImageData: (imageData: number[] | undefined) => void;
  watch: UseFormWatch<SearchValues>;
  onSubmit: (e?: BaseSyntheticEvent) => Promise<void>;
}

export default function ImageDropdown({ setImageData, watch, onSubmit }: ImageDropdownProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUpload = async () => {
    setImageData(undefined);
    if (isWeb) {
      // Reset the file input value
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Trigger file input click
      fileInputRef.current?.click();
    } else {
      try {
        // React Native upload
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });

        if (!result.canceled && result.assets[0]?.uri) {
          const response = await fetch(result.assets[0].uri);
          const blob = await response.blob();
          processFile(blob);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: Blob) => {
    const promise = processImage(file, setImageData, setIsPreviewOpen);

    const id = toast.promise(promise, {
      loading: "Processing image...",
      success: () => toast.dismiss(id),
      error: "Error processing image",
    });
  };

  const handleTakePhoto = () => {
    setIsCameraOpen(true);
  };
  return (
    <>
      {isWeb && (
        <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden accept="image/*" />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon">
            <ImageIcon className="text-primary-foreground p-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem onPress={handleUpload}>
              <UploadIcon className="text-primary-foreground p-0.5" />
              <Text>Upload</Text>
            </DropdownMenuItem>
            <DropdownMenuItem onPress={handleTakePhoto}>
              <CameraIcon className="text-primary-foreground p-0.5" />
              <Text>Take photo</Text>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ImagePreview
        watch={watch}
        setImageData={setImageData}
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        onSubmit={onSubmit}
      />
      <CameraPopup
        isOpen={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        setIsPreviewOpen={setIsPreviewOpen}
        setImageData={setImageData}
      />
    </>
  );
}
