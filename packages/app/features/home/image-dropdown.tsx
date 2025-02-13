import {
  cn,
  Div,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@dishify/ui";
import type React from "react";
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
          <Button
            accessibilityRole="button"
            variant="ghost"
            size="icon"
            className={cn(
              "relative h-9 sm:h-10 aspect-square w-auto rounded-xl overflow-hidden flex items-center justify-center",
              "bg-gradient-to-br from-sage-400 to-sage-500",
              "hover:from-sage-500 hover:to-sage-600",
              "web:transition-all transition-all duration-300 ease-in-out",
              "hover:scale-105 scale-100 active:scale-95",
              "text-white",
            )}
          >
            <CameraIcon
              className={cn(
                "h-5 sm:h-6 w-auto aspect-square transition-all duration-300 text-white overflow-visible",
                "group-hover:scale-105 group-hover:rotate-[-8deg] group-hover:mr-[4px] group-hover:mt-[2px]",
              )}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onPress={handleUpload}
              className="flex items-center gap-2 py-2 hover:cursor-pointer rounded-xl transition-colors duration-200 ease-in-out web:hover:bg-sage-50 web:focus:bg-sage-50"
            >
              <UploadIcon className="text-sage-500 h-4 w-4" />
              <Text>Upload</Text>
            </DropdownMenuItem>
            <DropdownMenuItem
              onPress={handleTakePhoto}
              className="flex items-center gap-2 py-2 hover:cursor-pointer rounded-xl transition-colors duration-200 ease-in-out web:hover:bg-sage-50 web:focus:bg-sage-50"
            >
              <CameraIcon className="text-sage-500 h-4 w-4" />
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
