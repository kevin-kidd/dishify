import { useState, useCallback } from "react";
import { View, Platform } from "react-native";
import { Share2, Copy, Check } from "lucide-react";
import { MotiView } from "moti";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Text,
  IconButton,
  Button,
  cn,
  Div,
} from "@dishify/ui";
import { Facebook, X, Pinterest, WhatsApp } from "@dishify/ui/src/icons/social";
import { toast } from "app/utils/toast";

interface ShareButtonProps {
  title: string;
  url: string;
  className?: string;
}

export function ShareButton({ title, url, className }: ShareButtonProps) {
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const truncatedUrl = url.length > 40 ? `${url.slice(0, 37)}...` : url;

  const handleCopyLink = useCallback(async () => {
    try {
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(url);
        setIsLinkCopied(true);
      }
      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link to clipboard");
    }
  }, [url]);

  const handleSocialShare = useCallback(
    async (platform: "facebook" | "twitter" | "pinterest" | "whatsapp") => {
      try {
        if (Platform.OS === "web") {
          const shareUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            twitter: `https://x.com/intent/tweet?url=${encodeURIComponent(
              url,
            )}&text=${encodeURIComponent(title)}`,
            pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
              url,
            )}&description=${encodeURIComponent(title)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${url}`)}`,
          };

          // Check if Web Share API is available and use it for better mobile web experience
          if (navigator.share && platform === "twitter") {
            await navigator.share({
              title,
              text: title,
              url,
            });
            toast.success("Shared successfully");
            return;
          }

          const windowFeatures = "width=600,height=400,menubar=no,toolbar=no,status=no";
          const shareWindow = window.open(shareUrls[platform], "_blank", windowFeatures);

          if (!shareWindow) {
            throw new Error("Popup blocked");
          }
        }
      } catch (error) {
        console.error(`Failed to share on ${platform}:`, error);
        if (error instanceof Error && error.message === "Popup blocked") {
          toast.error("Please allow popups to share");
        } else {
          toast.error(`Failed to share on ${platform}`);
        }
      }
    },
    [title, url],
  );

  const handleNativeShare = useCallback(async () => {
    // TODO: Implement native share
    try {
      toast.success("Shared successfully");
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share recipe");
    }
  }, []);

  if (Platform.OS !== "web") {
    return (
      <MotiView
        from={{ scale: 1 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        transition={{ type: "timing", duration: 150 }}
      >
        <Button
          className={cn(
            "flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100",
            className,
          )}
          onPress={handleNativeShare}
        >
          <Share2 className="h-4 w-4 text-gray-600" />
        </Button>
      </MotiView>
    );
  }

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger>
          <PopoverTrigger>
            <Div
              className={cn(
                "items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all duration-200",
                className,
              )}
            >
              <Share2 className="h-4 w-4 text-gray-600" />
              <span className="sr-only">Share Recipe</span>
            </Div>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent position="top">Share Recipe</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-64 p-4">
        <View className="space-y-4">
          <Text className="text-sm font-medium">Share via</Text>
          <View className="flex flex-row items-center justify-between px-2">
            <IconButton
              variant="ghost"
              size="sm"
              className="hover:bg-blue-50"
              onClick={() => handleSocialShare("facebook")}
            >
              <Facebook className="h-5 w-5 text-[#1877F2]" />
            </IconButton>
            <IconButton
              variant="ghost"
              size="sm"
              className="hover:bg-neutral-50"
              onPress={() => handleSocialShare("twitter")}
            >
              <X className="h-5 w-5 text-black" />
            </IconButton>
            <IconButton
              variant="ghost"
              size="sm"
              className="hover:bg-red-50"
              onPress={() => handleSocialShare("pinterest")}
            >
              <Pinterest className="h-5 w-5 text-[#E60023]" />
            </IconButton>
            <IconButton
              variant="ghost"
              size="sm"
              className="hover:bg-green-50"
              onPress={() => handleSocialShare("whatsapp")}
            >
              <WhatsApp className="h-5 w-5 text-[#25D366]" />
            </IconButton>
          </View>
          <Button
            onPress={handleCopyLink}
            className="flex flex-row items-center gap-2 px-3 py-2 bg-gray-50 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <View className="flex-1">
              <Text className="text-sm text-gray-600 truncate max-w-[200px]">{truncatedUrl}</Text>
            </View>
            <MotiView
              from={{ scale: 1, opacity: 1 }}
              animate={{
                scale: isLinkCopied ? 1.1 : 1,
                opacity: 1,
              }}
              transition={{
                type: "timing",
                duration: 150,
              }}
            >
              {isLinkCopied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-gray-600" />
              )}
            </MotiView>
          </Button>
        </View>
      </PopoverContent>
    </Popover>
  );
}
