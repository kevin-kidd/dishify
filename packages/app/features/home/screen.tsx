"use client";

import {
  H1,
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
  Text,
  OL,
  LI,
  UL,
  TextInput,
  Autocomplete,
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
import { DishNameSchema, type DishName } from "@dishify/api/schemas/dish-name";
import { isWeb } from "@tamagui/constants";

export function HomeScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DishName>({
    resolver: zodResolver(DishNameSchema),
    defaultValues: {
      dishName: "",
    },
  });
  const submitButtonRef = useRef<React.ElementRef<typeof Pressable>>(null);

  const [currentRecipe, setCurrentRecipe] = useState("");
  const { data, isFetching } = trpc.recipe.generate.useQuery(
    currentRecipe ? { dishName: currentRecipe } : skipToken,
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 3,
      retryDelay: 1000,
    }
  );
  const dishName = useWatch({
    control,
    name: "dishName",
  });
  const { data: autocompleteOptions, refetch: refetchAutocomplete } =
    trpc.recipe.autocomplete.useQuery(
      {
        query: dishName,
        language: "en",
      },
      {
        enabled: false,
        placeholderData: (prevData) => prevData,
        meta: { showToastOnError: false },
      }
    );
  const getOptions = useCallback(async () => {
    await refetchAutocomplete();
  }, [refetchAutocomplete]);
  const onSubmit = handleSubmit((data) => {
    setCurrentRecipe(data.dishName);
    if (isWeb) {
      submitButtonRef.current?.focus();
    } else {
      Keyboard.dismiss();
    }
  });

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-background p-4">
      <View className="container mx-auto w-full space-y-4">
        <H1>Dishify</H1>
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
                    id={name}
                    value={value}
                    onBlur={onBlur}
                    onChange={onChange}
                    placeholder="Enter a dish name"
                    autoCorrect={true}
                    maxLength={80}
                  />
                </Autocomplete>
              </FormInput>
            )}
          />
          <Button
            onPress={onSubmit}
            disabled={!!currentRecipe && isFetching}
            className="w-full sm:w-auto"
            ref={submitButtonRef}
          >
            <Text>{!!currentRecipe && isFetching ? "Generating..." : "Generate Recipe"}</Text>
          </Button>
        </Form>
        <View className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Recipe {data && `- ${data?.dishName}`}</CardTitle>
            </CardHeader>
            <CardContent>
              {!!currentRecipe && isFetching ? (
                <>
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                </>
              ) : data ? (
                <>
                  <P>
                    <Strong>Cooking Time:</Strong> {data.recipe.cookingTime}
                  </P>
                  <P>
                    <Strong>Servings:</Strong> {data.recipe.servings}
                  </P>
                  <H3 className="font-semibold mt-4 mb-2">Instructions:</H3>
                  <OL>
                    {data.recipe.instructions.map((step, index) => (
                      <LI key={`step-${index}-${step.slice(0, 5)}`} className="mb-2">
                        {step}
                      </LI>
                    ))}
                  </OL>
                </>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Shopping List</CardTitle>
            </CardHeader>
            <CardContent>
              {!!currentRecipe && isFetching ? (
                <>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                </>
              ) : data ? (
                <UL className="space-y-2">
                  {data.shoppingList.map((item, index) => (
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
