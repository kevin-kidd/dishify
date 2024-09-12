import { useCallback, useRef, useState, useEffect } from "react";
import { debounce } from "lodash";
import { isWeb } from "@tamagui/constants";
import { findNodeHandle } from "react-native";
import type { PopoverTriggerRef } from "@rn-primitives/popover";
import type { TextInput } from "../../elements/input";
import type { KeyboardEvent } from "react";
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";

export function useAutocomplete({ onSelect, getOptions, autocompleteOptions, children }) {
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<PopoverTriggerRef>(null);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const resetSelectedIndex = useCallback(() => setSelectedIndex(-1), []);

  const debouncedSearch = useCallback(
    debounce(async (text: string) => {
      if (text.length >= 3) {
        await getOptions(text);
        resetSelectedIndex();
        if (!isOpen) {
          triggerRef.current?.open?.();
        }
      } else {
        triggerRef.current?.close?.();
      }
    }, 300),
    []
  );

  const handleInputChange = useCallback(
    (text: string) => {
      debouncedSearch(text);
      if (isWeb) {
        children.props.onChange?.(text);
      } else {
        children.props.onChangeText?.(text);
      }
      setInputValue(text);
    },
    [debouncedSearch, children.props]
  );

  const handleSelectOption = useCallback(
    (option: string) => {
      onSelect(option);
      handleInputChange(option);
      triggerRef.current?.close?.();
    },
    [onSelect, handleInputChange]
  );

  const handleFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    resetSelectedIndex();
    triggerRef.current?.open?.();
    children.props.onFocus?.();
  }, [children.props, resetSelectedIndex]);

  const handleInteractOutside = useCallback((e: any) => {
    if (isWeb) {
      const inputElement = inputRef.current as unknown as HTMLInputElement;
      if (inputElement && (e.target === inputElement || inputElement.contains(e.target as Node))) {
        return;
      }
    } else {
      const inputHandle = findNodeHandle(inputRef.current);
      if (inputHandle && e.target === inputHandle) {
        return;
      }
    }
    e.preventDefault();
    triggerRef.current?.close?.();
  }, []);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent<HTMLInputElement> | NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (!isOpen || !autocompleteOptions || autocompleteOptions.length === 0) return;

      const key = isWeb
        ? (event as KeyboardEvent<HTMLInputElement>).key
        : (event as NativeSyntheticEvent<TextInputKeyPressEventData>).nativeEvent.key;

      switch (key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prevIndex) =>
            prevIndex < autocompleteOptions.length - 1 ? prevIndex + 1 : 0
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : autocompleteOptions.length - 1
          );
          break;
        case "Enter":
          if (selectedIndex !== -1) {
            event.preventDefault();
            handleSelectOption(autocompleteOptions[selectedIndex]);
          }
          break;
      }
    },
    [isOpen, autocompleteOptions, selectedIndex, handleSelectOption]
  );

  return {
    triggerRef,
    inputRef,
    isOpen,
    setIsOpen,
    inputValue,
    selectedIndex,
    handleInputChange,
    handleSelectOption,
    handleFocus,
    handleInteractOutside,
    handleKeyPress,
  };
}
