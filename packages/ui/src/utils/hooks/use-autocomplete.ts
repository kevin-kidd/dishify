"use client";

import { useCallback, useRef, useState } from "react";
import { debounce } from "lodash";
import { isWeb } from "@tamagui/constants";
import { findNodeHandle } from "react-native";
import type { PopoverTriggerRef } from "@rn-primitives/popover";
import type { TextInput } from "../../elements/input";
import type { KeyboardEvent } from "react";
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";

export function useAutocomplete({
  onSelect,
  getOptions,
  autocompleteOptions,
  children,
  onTemporaryChange,
}) {
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<PopoverTriggerRef>(null);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [originalInputValue, setOriginalInputValue] = useState("");
  const [isSelectingOption, setIsSelectingOption] = useState(false);
  const [isTemporaryChange, setIsTemporaryChange] = useState(false);

  const resetSelectedIndex = useCallback(() => {
    setSelectedIndex(-1);
    if (isTemporaryChange && originalInputValue !== inputValue) {
      setInputValue(originalInputValue);
      setIsTemporaryChange(false);
      if (onTemporaryChange) {
        onTemporaryChange(originalInputValue);
      } else {
        if (isWeb) {
          children.props.onChange?.(originalInputValue);
        } else {
          children.props.onChangeText?.(originalInputValue);
        }
      }
    }
  }, [originalInputValue, inputValue, children.props, onTemporaryChange, isTemporaryChange]);

  const debouncedSearch = useCallback(
    debounce(async (text: string) => {
      if (!isTemporaryChange && text.length >= 3) {
        await getOptions(text);
        resetSelectedIndex();
        setOriginalInputValue(text);
        if (!isOpen) {
          triggerRef.current?.open?.();
        }
      } else if (!isTemporaryChange) {
        triggerRef.current?.close?.();
      }
    }, 300),
    [],
  );

  const handleInputChange = useCallback(
    (text: string) => {
      setInputValue(text);
      setOriginalInputValue(text);
      setIsTemporaryChange(false);
      debouncedSearch(text);
      if (isWeb) {
        children.props.onChange?.(text);
      } else {
        children.props.onChangeText?.(text);
      }
    },
    [debouncedSearch, children.props],
  );

  const handleSelectOption = useCallback(
    (option: string, shouldSubmit = false) => {
      setIsSelectingOption(true);
      setIsTemporaryChange(false);
      onSelect(option);
      handleInputChange(option);
      triggerRef.current?.close?.();
      if (shouldSubmit && children.props.onSubmit) {
        children.props.onSubmit();
      }
      setTimeout(() => {
        setIsSelectingOption(false);
      }, 100);
    },
    [onSelect, handleInputChange, children.props],
  );

  const updateInputWithoutSearch = useCallback(
    (text: string) => {
      setIsTemporaryChange(true);
      setInputValue(text);
      if (onTemporaryChange) {
        onTemporaryChange(text);
      } else {
        if (isWeb) {
          children.props.onChange?.(text);
        } else {
          children.props.onChangeText?.(text);
        }
      }
    },
    [children.props, onTemporaryChange],
  );

  const handleFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    resetSelectedIndex();
    if (inputValue.length >= 3) {
      debouncedSearch(inputValue);
    }
    triggerRef.current?.open?.();
    children.props.onFocus?.();
  }, [children.props, resetSelectedIndex, debouncedSearch, inputValue]);

  const handleBlur = useCallback(() => {
    if (isSelectingOption) return;

    blurTimeoutRef.current = setTimeout(() => {
      triggerRef.current?.close?.();
      if (isTemporaryChange) {
        resetSelectedIndex();
      }
      children.props.onBlur?.();
    }, 150);
  }, [children.props, isSelectingOption, isTemporaryChange, resetSelectedIndex]);

  const handleInteractOutside = useCallback(
    (e: any) => {
      if (isWeb) {
        const inputElement = inputRef.current as unknown as HTMLInputElement;
        if (
          inputElement &&
          (e.target === inputElement || inputElement.contains(e.target as Node))
        ) {
          return;
        }
      } else {
        const inputHandle = findNodeHandle(inputRef.current);
        if (inputHandle && e.target === inputHandle) {
          return;
        }
      }
      e.preventDefault();
      if (!isSelectingOption) {
        triggerRef.current?.close?.();
      }
    },
    [isSelectingOption],
  );

  const handleKeyPress = useCallback(
    (event: KeyboardEvent<HTMLInputElement> | NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (!isOpen || !autocompleteOptions || autocompleteOptions.length === 0) return;

      const key = isWeb
        ? (event as KeyboardEvent<HTMLInputElement>).key
        : (event as NativeSyntheticEvent<TextInputKeyPressEventData>).nativeEvent.key;

      switch (key) {
        case "ArrowDown": {
          event.preventDefault();
          const nextIndex = selectedIndex < autocompleteOptions.length - 1 ? selectedIndex + 1 : 0;
          setSelectedIndex(nextIndex);
          updateInputWithoutSearch(autocompleteOptions[nextIndex]);
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          if (selectedIndex <= 0) {
            setSelectedIndex(-1);
            updateInputWithoutSearch(originalInputValue);
          } else {
            const prevIndex = selectedIndex - 1;
            setSelectedIndex(prevIndex);
            updateInputWithoutSearch(autocompleteOptions[prevIndex]);
          }
          break;
        }
        case "Enter": {
          if (selectedIndex !== -1) {
            event.preventDefault();
            handleSelectOption(autocompleteOptions[selectedIndex], true);
          }
          break;
        }
      }
    },
    [
      isOpen,
      autocompleteOptions,
      selectedIndex,
      handleSelectOption,
      originalInputValue,
      updateInputWithoutSearch,
    ],
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
    handleBlur,
    handleInteractOutside,
    handleKeyPress,
  };
}
