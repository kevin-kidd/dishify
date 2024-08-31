import { View } from "react-native";
import { withWebTag } from "../utils/web-tag";

{
  /* Lists */
}
export const UnorderedList = withWebTag(View, "ul", "list-disc list-inside");
export const OrderedList = withWebTag(View, "ol", "list-decimal list-inside");
export const ListItem = withWebTag(View, "li");
