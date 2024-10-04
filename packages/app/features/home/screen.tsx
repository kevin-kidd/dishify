"use client";

import {
  P,
  Button,
  Form,
  FormInput,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Span,
  Strong,
  H3,
  Image,
  OL,
  LI,
  UL,
  TextInput,
  Autocomplete,
  Text,
} from "@dishify/ui";
import { Skeleton } from "@dishify/ui/src/elements/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSearchUrl } from "app/utils/helpers";
import { trpc } from "app/utils/trpc";
import { useCallback, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { View, ScrollView, Keyboard, type Pressable } from "react-native";
import { Link } from "solito/link";
import { skipToken } from "@tanstack/react-query";
import { SearchSchema, type SearchValues } from "@dishify/api/schemas/search";
import { isWeb } from "@tamagui/constants";
import { SendHorizontal } from "@dishify/ui/src/icons/send-horizontal";
import { LoaderCircle } from "@dishify/ui/src/icons/loader-circle";
import ImageDropdown from "./image-dropdown";
import type { RecipeResponse } from "@dishify/api/schemas/recipe-response";
import { toast } from "app/utils/toast";

export function HomeScreen() {
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
  const submitButtonRef = useRef<React.ElementRef<typeof Pressable>>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [recipeData, setRecipeData] = useState<RecipeResponse>();
  const generate = trpc.recipe.generate.useMutation();
  // const { data, isFetching } = trpc.recipe.generate.useQuery(
  //   currentRecipe || imageData ? { dishName: currentRecipe, image: imageData } : skipToken,
  //   {
  //     refetchOnWindowFocus: false,
  //     refetchOnMount: false,
  //     refetchOnReconnect: false,
  //     retry: 3,
  //     retryDelay: 1000,
  //   }
  // );
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
    setIsLoading(true);
    try {
      const response = await generate.mutateAsync({ image: data.image });
      if (response) {
        setRecipeData(response);
      }
    } catch (error) {
      toast.error(error.message);
    }
    setIsLoading(false);
  });
  const onSubmit = handleSubmit(async (data) => {
    setIsLoading(true);
    if (isWeb) {
      submitButtonRef.current?.focus();
    } else {
      Keyboard.dismiss();
    }
    try {
      const response = await generate.mutateAsync({ dishName: data.dishName });
      if (response) {
        setRecipeData(response);
      }
    } catch (error) {
      toast.error(error.message);
    }

    setIsLoading(false);
  });

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-background p-4">
      <View className="container mx-auto w-full space-y-4 h-full pt-20 max-w-4xl">
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
          <Button size="icon" disabled={isLoading} ref={submitButtonRef} onPress={onSubmit}>
            {isLoading ? (
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
        <View className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Recipe {recipeData && `- ${recipeData?.dishName}`}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                </>
              ) : recipeData ? (
                <>
                  <P className="text-foreground">
                    <Strong>Cooking Time:</Strong> {recipeData.recipe.cookingTime}
                  </P>
                  <P className="text-foreground">
                    <Strong>Servings:</Strong> {recipeData.recipe.servings}
                  </P>
                  <H3 className="font-semibold mt-4 mb-2 text-foreground">Instructions:</H3>
                  <UL>
                    {recipeData.recipe.instructions.map((step, index) => (
                      <LI
                        key={`step-${index}-${step.slice(0, 5)}`}
                        className="mb-2 text-foreground"
                      >
                        {step}
                      </LI>
                    ))}
                  </UL>
                </>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Shopping List</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                </>
              ) : recipeData ? (
                <UL className="space-y-2">
                  {recipeData.shoppingList.map((item, index) => (
                    <LI
                      key={`step-${index}-${item.item}`}
                      className="flex items-center justify-between py-2"
                    >
                      <Span className="mr-4">
                        {item.quantity} {item.item}
                      </Span>
                      <View className="flex flex-row space-x-2">
                        <Link
                          href={getSearchUrl("walmart", item.item)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="icon" className="w-20 h-10 p-0">
                            <Image
                              src="/shop-logos/walmart-logo.svg"
                              alt="Walmart"
                              className="w-full h-full"
                              fill={true}
                            />
                          </Button>
                        </Link>
                        <Link
                          href={getSearchUrl("amazon", item.item)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="icon" className="w-20 h-10 p-0">
                            <Image
                              src="/shop-logos/amazon-logo.png"
                              alt="Amazon"
                              className="w-full h-full"
                              fill={true}
                            />
                          </Button>
                        </Link>
                        <Link
                          href={getSearchUrl("wholefoods", item.item)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="icon" className="w-20 h-10 p-0">
                            <Image
                              src="/shop-logos/wholefoods-logo.png"
                              alt="Whole Foods"
                              className="w-full h-full"
                              fill={true}
                            />
                          </Button>
                        </Link>
                      </View>
                    </LI>
                  ))}
                </UL>
              ) : null}
            </CardContent>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
