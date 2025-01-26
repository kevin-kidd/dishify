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
  ({ children, onSelect, getOptions, autocompleteOptions, className }, ref) => {
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
    } = useAutocomplete({ onSelect, getOptions, autocompleteOptions, children });

    const sheetTriggerRef = React.useRef<HTMLButtonElement>(null);
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isMobileSize = width < 768;
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);

    const contentInsets = {
      top: insets.top,
      bottom: insets.bottom,
      left: 12,
      right: 12,
    };

    // Effect to focus input when sheet opens
    React.useEffect(() => {
      if (isSheetOpen && inputRef.current) {
        // Small delay to ensure the sheet animation has started
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [isSheetOpen, inputRef]);

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
                console.log("Autocomplete: onFocus called");
                console.log("isMobileSize:", isMobileSize);
                handleFocus();
                if (isMobileSize) {
                  console.log("Autocomplete: setting isOpen to true");
                  setIsOpen(true);
                  setIsSheetOpen(true);
                }
                // Call the original onFocus if it exists
                inputElement.props.onFocus?.(e);
              },
              ref: inputRef as any,
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
    ]);

    const handleSheetOpenChange = (open: boolean) => {
      setIsOpen(open);
      setIsSheetOpen(open);
      if (!open) {
        // When closing the sheet, we want to blur the input to hide the keyboard
        inputRef.current?.blur();
      }
    };

    const shouldShowOptions =
      isOpen &&
      autocompleteOptions &&
      autocompleteOptions.length > 0 &&
      inputValue.length >= 3 &&
      inputValue.slice(0, 3) === autocompleteOptions[0].slice(0, 3);

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
              className={cn(
                shouldShowOptions ? "w-[--radix-popover-trigger-width] p-1 mt-1" : "hidden",
                "shadow-lg rounded-lg border border-primary/60",
              )}
              animationDuration={0}
            >
              <OptionsList
                options={autocompleteOptions || []}
                selectedIndex={selectedIndex}
                onSelect={handleSelectOption}
              />
            </PopoverContent>
          </Popover>
        </View>
      );
    }

    return (
      <View ref={ref} className={cn(className, "w-full")}>
        {enhancedChildren}
        <Drawer open={isOpen} onOpenChange={handleSheetOpenChange}>
          <DrawerTrigger ref={sheetTriggerRef} className="hidden" />
          <DrawerContent className="h-screen sm:max-w-none w-screen px-4">
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
                    handleSelectOption(option);
                    setIsOpen(false);
                    setIsSheetOpen(false);
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
