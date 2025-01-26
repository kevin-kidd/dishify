import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "../../elements/text";
import { cn } from "../../utils";
import type { OptionItemProps, OptionsListProps } from "./types";
import { Search } from "../../icons/search";

export const OptionsList = React.memo(({ options, selectedIndex, onSelect }: OptionsListProps) => (
  <View className="w-full rounded-lg border border-primary/60 sm:border-none p-1 sm:p-0">
    <Text className="py-2 pl-2 text-xs font-semibold text-muted-foreground">Suggestions</Text>
    {options.map((option, index) => (
      <OptionItem
        key={option}
        option={option}
        onPress={onSelect}
        isSelected={index === selectedIndex}
      />
    ))}
  </View>
));

export const OptionItem = React.memo(({ option, onPress, isSelected }: OptionItemProps) => (
  <Pressable
    key={option}
    onPress={() => onPress(option)}
    className={cn(
      "w-full flex-1 flex-row gap-2 sm:gap-0 items-center group web:cursor-default transition-colors duration-100 ease-in-out web:select-none rounded-sm py-1.5 native:py-2 px-2 sm:px-4 web:hover:bg-input web:outline-none",
      isSelected && "bg-input",
    )}
  >
    <Search className="h-4 w-4 sm:hidden text-primary" />
    <Text className={cn("text-sm native:text-lg text-popover-foreground native:text-base")}>
      {option}
    </Text>
  </Pressable>
));
