import { toast as NativeToast } from "sonner-native";
import { toast as WebToast } from "sonner";
import { isWeb } from "@tamagui/constants";

export const toast = isWeb ? WebToast : NativeToast;
