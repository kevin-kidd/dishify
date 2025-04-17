"use client";

import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { cn } from "../../utils";
import { View } from "react-native";
import { useWindowDimensions } from "react-native";
import { useAutocomplete } from "../../utils/hooks/use-autocomplete";
import { OptionsList } from "./options-list";
import type { AutocompleteProps } from "./types";
import { TextInput } from "../input";
import { DrawerTrigger, Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../drawer";

interface TextInputElement extends React.ReactElement<any> {
  type: typeof TextInput;
  props: React.ComponentProps<typeof TextInput> & {
    onFocus?: (...args: any[]) => void;
    onChangeText?: (text: string) => void;
    onKeyPress?: (event: any) => void;
    children?: React.ReactNode;
    ref?: React.RefObject<any> | React.MutableRefObject<any> | ((instance: any) => void);
  };
}

interface FormElement extends React.ReactElement<any> {
  props: {
    children?: React.ReactNode;
    onFocus?: () => void;
    onBlur?: () => void;
  };
}

export const Autocomplete = React.forwardRef<React.ComponentRef<typeof View>, AutocompleteProps>(
  (
    {
      children,
      onSelect,
      getOptions,
      autocompleteOptions,
      isInteractive = true,
      className,
      onTemporaryChange,
    },
    ref,
  ) => {
    const {
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
      handleBlur,
    } = useAutocomplete({ onSelect, getOptions, autocompleteOptions, children, onTemporaryChange });

    const drawerTriggerRef = React.useRef<HTMLButtonElement>(null);
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isMobileSize = width < 768;
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

    const contentInsets = {
      top: insets.top,
      bottom: insets.bottom,
      left: 12,
      right: 12,
    };

    // Effect to focus input when sheet opens
    React.useEffect(() => {
      if (isDrawerOpen && inputRef.current) {
        // Small delay to ensure the sheet animation has started
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [isDrawerOpen, inputRef]);

    // Find the TextInput within the Form and clone it with focus handling
    const enhancedChildren = React.useMemo(() => {
      return React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;

        // If this is a Form component, recursively search for and enhance the TextInput
        const enhanceInput = (element: React.ReactElement) => {
          if (!React.isValidElement(element)) return element;

          // Check if this is our TextInput component
          if (element.type === TextInput) {
            const inputElement = element as TextInputElement;
            return React.cloneElement(inputElement, {
              ...inputElement.props,
              onChangeText: handleInputChange,
              onFocus: (e: any) => {
                // Stop propagation to prevent the event from bubbling up to the Form
                e?.stopPropagation?.();
                if (!isInteractive) return;
                handleFocus();
                if (isMobileSize) {
                  setIsOpen(true);
                  setIsDrawerOpen(true);
                }
                // Call the original onFocus if it exists
                inputElement.props.onFocus?.(e);
              },
              onBlur: (e: any) => {
                handleBlur();
                if (isMobileSize) {
                  setIsOpen(false);
                  setIsDrawerOpen(false);
                }
                // Call the original onBlur if it exists
                inputElement.props.onBlur?.(e);
              },
              ref: (node: any) => {
                // Forward the ref to both our inputRef and any provided ref
                if (node) {
                  // Cast to MutableRefObject to allow assignment
                  (inputRef as React.MutableRefObject<any>).current = node;
                  if (typeof inputElement.props.ref === "function") {
                    inputElement.props.ref(node);
                  } else if (inputElement.props.ref && "current" in inputElement.props.ref) {
                    // Cast to MutableRefObject and assign
                    (inputElement.props.ref as React.MutableRefObject<any>).current = node;
                  }
                }
              },
              onKeyPress: handleKeyPress,
            });
          }

          // Recursively handle children if they exist
          if (React.isValidElement(element)) {
            const formElement = element as FormElement;
            if (formElement.props.children) {
              const newChildren = React.Children.map(formElement.props.children, enhanceInput);
              // Create a wrapper for focus/blur handlers that preserves the original event
              const handleFormFocus = () => {
                const input = inputRef.current;
                if (input && input === (document.activeElement as any)) {
                  handleFocus();
                  formElement.props.onFocus?.();
                }
              };
              const handleFormBlur = () => {
                const input = inputRef.current;
                if (input && input !== (document.activeElement as any)) {
                  formElement.props.onBlur?.();
                }
              };
              return React.cloneElement(formElement, {
                ...formElement.props,
                children: newChildren,
                onFocus: handleFormFocus,
                onBlur: handleFormBlur,
              });
            }
          }

          return element;
        };

        return enhanceInput(child);
      });
    }, [
      children,
      handleInputChange,
      handleFocus,
      isMobileSize,
      setIsOpen,
      inputRef,
      handleKeyPress,
      isInteractive,
      handleBlur,
    ]);

    const handleDrawerOpenChange = (open: boolean) => {
      if (!isInteractive) return;
      setIsOpen(open);
      setIsDrawerOpen(open);
      if (!open) {
        // When closing the sheet, we want to blur the input to hide the keyboard
        inputRef.current?.blur();
      }
    };

    const shouldShowOptions =
      isInteractive &&
      isOpen &&
      autocompleteOptions &&
      autocompleteOptions.length > 0 &&
      inputValue.length >= 2;

    if (!isMobileSize) {
      return (
        <View ref={ref} className={cn(className, "w-full max-w-2xl mx-auto")}>
          {enhancedChildren}
          <Popover onOpenChange={setIsOpen}>
            <PopoverTrigger ref={triggerRef} className="w-full" />
            <PopoverContent
              onFocusOutside={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => e.preventDefault()}
              onInteractOutside={handleInteractOutside}
              onPointerDownOutside={(e) => e.preventDefault()}
              onOpenAutoFocus={(e) => e.preventDefault()}
              insets={contentInsets}
              side="bottom"
              avoidCollisions={false}
              className={cn(
                shouldShowOptions
                  ? "w-[--radix-popover-trigger-width] border-none p-0 mt-1 bg-transparent rounded-xl"
                  : "hidden",
              )}
              animationDuration={0}
            >
              <OptionsList
                options={autocompleteOptions || []}
                selectedIndex={selectedIndex}
                onSelect={(option) => handleSelectOption(option, true)}
              />
            </PopoverContent>
          </Popover>
        </View>
      );
    }

    return (
      <View ref={ref} className={cn(className, "w-full")}>
        {enhancedChildren}
        <Drawer open={isOpen} onOpenChange={handleDrawerOpenChange}>
          <DrawerTrigger ref={drawerTriggerRef} className="hidden" />
          <DrawerContent className="h-[100svh] sm:max-w-none w-screen px-4">
            <DrawerHeader className="h-0 p-0 m-0">
              <DrawerTitle className="sr-only">Search</DrawerTitle>
            </DrawerHeader>

            <View className="fixed inset-x-0 top-0 z-50 bg-background pb-4 mt-14 px-4">
              {enhancedChildren}
            </View>
            <View className="mt-24">
              {shouldShowOptions && (
                <OptionsList
                  options={autocompleteOptions || []}
                  selectedIndex={selectedIndex}
                  onSelect={(option) => {
                    handleSelectOption(option, true);
                    setIsOpen(false);
                    setIsDrawerOpen(false);
                  }}
                />
              )}
            </View>
          </DrawerContent>
        </Drawer>
      </View>
    );
  },
);

Autocomplete.displayName = "Autocomplete";
