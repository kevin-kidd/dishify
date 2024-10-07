import { trpc } from "app/utils/trpc";
import { useCallback, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SearchSchema, type SearchValues } from "@dishify/api/schemas/search";
import { isWeb } from "@tamagui/constants";
import { SendHorizontal } from "@dishify/ui/src/icons/send-horizontal";
import { LoaderCircle } from "@dishify/ui/src/icons/loader-circle";
import ImageDropdown from "./image-dropdown";
import { toast } from "app/utils/toast";
import { Keyboard, type Pressable } from "react-native";
import { Autocomplete, Button, Form, FormInput, TextInput } from "@dishify/ui";
import { useAtom } from "jotai";
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
  const [recipe, setRecipe] = useAtom(recipeAtom);
  const submitButtonRef = useRef<React.ElementRef<typeof Pressable>>(null);
  const generate = trpc.recipe.generate.useMutation();
  const dishName = useWatch({
    control,
    name: "dishName",
  });
  const { data: autocompleteOptions, refetch: refetchAutocomplete } =
    trpc.recipe.autocomplete.useQuery(
      {
        query: dishName ?? "",
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
    <Form className="mb-4 flex flex-col sm:flex-row gap-2 items-center" onSubmit={onSubmit}>
      <Controller
        name="dishName"
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, name, value } }) => (
          <FormInput error={errors.dishName?.message} id={name}>
            <Autocomplete
              onSelect={(selectedValue) => onChange(selectedValue)}
              getOptions={getOptions}
              autocompleteOptions={autocompleteOptions}
            >
              <TextInput
                inputMode="search"
                id={name}
                value={value}
                onBlur={onBlur}
                onChange={onChange}
                placeholder="Enter a dish name"
                maxLength={80}
              />
            </Autocomplete>
          </FormInput>
        )}
      />
      <Button size="icon" disabled={recipe.isLoading} ref={submitButtonRef} onPress={onSubmit}>
        {recipe.isLoading ? (
          <LoaderCircle className="animate-spin text-primary-foreground p-0.5" />
        ) : (
          <SendHorizontal className="text-primary-foreground p-0.5" />
        )}
      </Button>
      <ImageDropdown
        setImageData={(imageData: number[] | undefined) => setValue("image", imageData)}
        watch={watch}
        onSubmit={onSubmitImage}
      />
    </Form>
  );
}
