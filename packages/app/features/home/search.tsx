"use client";

import { trpc } from "app/utils/trpc";
import { useCallback, useRef, useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchSchema, type SearchValues } from "@dishify/api/schemas/search";
import { isWeb } from "@tamagui/constants";
import ImageDropdown from "./image-dropdown";
import { toast } from "app/utils/toast";
import { Keyboard, View, type Pressable } from "react-native";
import { Autocomplete, cn, Form, FormInput, TextInput, Skeleton } from "@dishify/ui";
import { Search as SearchIcon } from "@dishify/ui/src/icons/search";
import { useRouter, usePathname } from "solito/navigation";
import { TRPCClientError } from "@trpc/client";
import type React from "react";

export default function Search() {
  const router = useRouter();
  const pathname = usePathname();
  const { control, handleSubmit, watch, setValue } = useForm<SearchValues>({
    resolver: zodResolver(SearchSchema),
    mode: "onSubmit",
    defaultValues: {
      dishName: "",
      image: [],
    },
  });
  const [isFocused, setIsFocused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const lastPathRef = useRef(pathname);

  // Reset generating state when pathname changes
  useEffect(() => {
    if (lastPathRef.current !== pathname) {
      setIsGenerating(false);
      lastPathRef.current = pathname;
    }
  }, [pathname]);

  const generate = trpc.recipe.generate.useMutation({
    onMutate: () => {
      setIsGenerating(true);
      // Dismiss keyboard and blur input on mutation start
      if (!isWeb) {
        Keyboard.dismiss();
      }
      inputRef.current?.blur();
      setIsFocused(false);
    },
    onError: (error) => {
      setIsGenerating(false);
      // Handle specific error types
      if (error instanceof TRPCClientError) {
        toast.error(error.message);
        return;
      }
      // Handle unexpected errors
      toast.error("Failed to generate recipe", {
        description: "Something went wrong. Please try again later.",
      });
    },
    onSuccess: (response) => {
      router.push(`/dish/${response.slug}`);
      // Don't reset isGenerating here, let the pathname change handle it
    },
  });

  const { data: autocompleteOptions, refetch: refetchAutocomplete } =
    trpc.recipe.autocomplete.useQuery(
      {
        query: watch("dishName") ?? "",
        language: "en",
      },
      {
        enabled: false,
        placeholderData: (prevData) => prevData,
        meta: { skipErrorToast: true },
      },
    );

  const getOptions = useCallback(async () => {
    if (isGenerating || !isFocused) return;
    await refetchAutocomplete();
  }, [refetchAutocomplete, isGenerating, isFocused]);

  const handleGenerate = useCallback(
    async (data: SearchValues) => {
      // Don't catch errors here, let them propagate up
      return generate.mutateAsync(data);
    },
    [generate],
  );

  const submitForm = useCallback(
    async (data: SearchValues) => {
      if (isGenerating) return;
      // Don't catch errors here, let them propagate up

      if (data.image?.length) {
        await handleGenerate({ image: data.image });
      } else if (data.dishName) {
        await handleGenerate({ dishName: data.dishName });
      }
    },
    [handleGenerate, isGenerating],
  );

  const onSubmit = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      e?.preventDefault();
      if (!isGenerating) {
        try {
          await handleSubmit(submitForm)(e);
          // Blur the input after form submission
          inputRef.current?.blur();
          setIsFocused(false);
        } catch (error) {
          // Let the mutation's onError handle the error display
          // This ensures the loading state is properly reset
          console.error("Form submission failed:", error);
        }
      }
    },
    [isGenerating, handleSubmit, submitForm],
  );

  const handleImageSubmit = useCallback(
    async (e?: React.BaseSyntheticEvent) => {
      e?.preventDefault();
      if (!isGenerating) {
        try {
          const values = control._formValues as SearchValues;
          if (values.image?.length) {
            await submitForm({ image: values.image });
          }
        } catch (error) {
          // Let the mutation's onError handle the error display
          // This ensures the loading state is properly reset
          console.error("Image submission failed:", error);
        }
      }
    },
    [isGenerating, control, submitForm],
  );

  return (
    <Controller
      name="dishName"
      control={control}
      rules={{
        required: true,
      }}
      render={({ field: { onChange, onBlur, name, value, ref } }) => (
        <Autocomplete
          onSelect={onChange}
          getOptions={getOptions}
          autocompleteOptions={autocompleteOptions}
          isInteractive={!isGenerating}
          onTemporaryChange={(text) => {
            // This is for keyboard navigation - just update the field value without triggering validation
            setValue("dishName", text, { shouldValidate: false });
          }}
        >
          <Form
            ref={formRef}
            className={cn(
              "p-1 sm:p-2",
              "group relative flex-1 w-full items-center flex max-h-12 sm:max-h-14",
              "rounded-2xl overflow-hidden",
              "bg-white border border-sage-200",
              "transition-all duration-200 ease-in-out",
              isFocused && "ring-2 ring-sage-500 border-transparent",
              isGenerating && "opacity-50 pointer-events-none",
            )}
            onSubmit={onSubmit}
          >
            <FormInput id={name} className="flex-1 w-full flex-row relative items-center gap-0">
              <View className="absolute left-2 h-5 w-5 flex items-center justify-center">
                {isGenerating ? (
                  <Skeleton className="h-5 w-5 rounded-full animate-pulse" />
                ) : (
                  <SearchIcon
                    className={cn(
                      "h-5 w-5 transition-all duration-200 text-sage-400",
                      isFocused && "text-sage-500",
                    )}
                  />
                )}
              </View>
              <TextInput
                inputMode="search"
                id={name}
                value={value}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setIsFocused(false);
                  onBlur();
                }}
                onChange={onChange}
                onChangeText={onChange}
                onSubmitEditing={onSubmit}
                returnKeyType="search"
                className={cn(
                  "text-md sm:text-lgflex border-0 bg-transparent pl-10 sm:pl-12",
                  "web:focus-visible:ring-0 web:focus-visible:ring-offset-0",
                  "placeholder:text-sage-400 transition-colors duration-200",
                  isGenerating && "text-sage-200",
                )}
                placeholder={isGenerating ? "Generating recipe..." : "Search any dish..."}
                maxLength={80}
                editable={!isGenerating}
              />
              <ImageDropdown
                setImageData={(imageData: number[] | undefined) => setValue("image", imageData)}
                watch={watch}
                onSubmit={handleImageSubmit}
              />
            </FormInput>
          </Form>
        </Autocomplete>
      )}
    />
  );
}
