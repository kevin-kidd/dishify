import { trpc } from "app/utils/trpc";
import { useCallback, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchSchema, type SearchValues } from "@dishify/api/schemas/search";
import { isWeb } from "@tamagui/constants";
import { SendHorizontal } from "@dishify/ui/src/icons/send-horizontal";
import { LoaderCircle } from "@dishify/ui/src/icons/loader-circle";
import ImageDropdown from "./image-dropdown";
import { toast } from "app/utils/toast";
import { Keyboard, type Pressable } from "react-native";
import { Autocomplete, Button, cn, Div, Form, FormInput, TextInput } from "@dishify/ui";
import { useAtom } from "jotai";
import { Search as SearchIcon } from "@dishify/ui/src/icons/search";
import { recipeAtom } from "app/atoms/recipe";

export default function Search() {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SearchValues>({
    resolver: zodResolver(SearchSchema),
    mode: "onSubmit",
    defaultValues: {
      dishName: "",
      image: [],
    },
  });
  const [isFocused, setIsFocused] = useState(false);
  const [recipe, setRecipe] = useAtom(recipeAtom);
  const submitButtonRef = useRef<React.ElementRef<typeof Pressable>>(null);
  const generate = trpc.recipe.generate.useMutation();
  const { data: autocompleteOptions, refetch: refetchAutocomplete } =
    trpc.recipe.autocomplete.useQuery(
      {
        query: watch("dishName") ?? "",
        language: "en",
      },
      {
        enabled: false,
        placeholderData: (prevData) => prevData,
        meta: { showToastOnError: false },
      },
    );

  const getOptions = useCallback(async () => {
    await refetchAutocomplete();
  }, [refetchAutocomplete]);

  const onSubmitImage = handleSubmit(async (data) => {
    setRecipe((prev) => {
      prev.isLoading = true;
      prev.data = null;
    });
    try {
      const response = await generate.mutateAsync({ image: data.image });
      if (response) {
        setRecipe((prev) => {
          prev.data = response;
        });
      }
    } catch (error) {
      toast.error(error.message);
    }
    setRecipe((prev) => {
      prev.isLoading = false;
    });
  });

  const onSubmit = handleSubmit(async (data) => {
    setRecipe((prev) => {
      prev.isLoading = true;
      prev.data = null;
    });
    if (isWeb) {
      submitButtonRef.current?.focus();
    } else {
      Keyboard.dismiss();
    }
    try {
      const response = await generate.mutateAsync({ dishName: data.dishName });
      if (response) {
        setRecipe((prev) => {
          prev.data = response;
        });
      }
    } catch (error) {
      toast.error(error.message);
    }
    setRecipe((prev) => {
      prev.isLoading = false;
    });
  });

  return (
    <Controller
      name="dishName"
      control={control}
      rules={{
        required: true,
      }}
      render={({ field: { onChange, onBlur, name, value } }) => (
        <Autocomplete
          onSelect={onChange}
          getOptions={getOptions}
          autocompleteOptions={autocompleteOptions}
        >
          <Form
            className={cn(
              "p-1 sm:p-2",
              "group relative flex-1 w-full items-center flex max-h-12 sm:max-h-14",
              "rounded-2xl overflow-hidden",
              "bg-white border border-primary/60",
              "transition-all duration-300 ease-in-out",
              isFocused && "ring-2 ring-primary/80 border-transparent",
            )}
            onSubmit={onSubmit}
          >
            <FormInput
              error={errors.dishName?.message}
              id={name}
              className="flex-1 w-full flex-row relative items-center gap-0"
            >
              <SearchIcon className="absolute left-2 h-5 w-5 transition-all duration-300 text-primary" />
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
                className="text-md sm:text-lgflex border-0 bg-transparent pl-10 sm:pl-12 web:focus-visible:ring-0 web:focus-visible:ring-offset-0 placeholder:text-primary/70 transition-colors duration-300"
                placeholder="Search any dish..."
                maxLength={80}
              />
              <ImageDropdown
                setImageData={(imageData: number[] | undefined) => setValue("image", imageData)}
                watch={watch}
                onSubmit={onSubmitImage}
              />
            </FormInput>
          </Form>
        </Autocomplete>
      )}
    />
  );
}
