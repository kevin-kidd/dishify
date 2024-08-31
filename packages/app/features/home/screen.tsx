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
  OrderedList,
  ListItem,
  UnorderedList,
  Image,
  Text,
} from "@dishify/ui";
import { Skeleton } from "@dishify/ui/src/elements/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSearchUrl } from "app/utils/helpers";
import { trpc } from "app/utils/trpc";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View, ScrollView } from "react-native";
import { Link } from "solito/link";
import { z } from "zod";
import { skipToken } from "@tanstack/react-query";

export function HomeScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dishName: "",
    },
  });
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
  const onSubmit = handleSubmit((data) => {
    setCurrentRecipe(data.dishName);
  });

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-background p-4">
      <View className="container mx-auto w-full space-y-4">
        <H1>Dishify</H1>
        <Form className="mb-4 flex flex-row gap-x-2 items-center">
          <Controller
            name="dishName"
            control={control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, name, value } }) => (
              <FormInput
                type="text"
                autoComplete="email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCorrect={false}
                error={errors.dishName?.message}
                placeholder="Enter a dish name"
                id={name}
              />
            )}
          />
          <Button onPress={onSubmit} disabled={!!currentRecipe && isFetching}>
            <Text>{!!currentRecipe && isFetching ? "Generating..." : "Generate Recipe"}</Text>
          </Button>
        </Form>
        <View className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Recipe</CardTitle>
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
                  <OrderedList>
                    {data.recipe.instructions.map((step, index) => (
                      <ListItem key={`step-${index}-${step.slice(0, 5)}`} className="mb-2">
                        {step}
                      </ListItem>
                    ))}
                  </OrderedList>
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
                <UnorderedList className="space-y-2">
                  {data.shoppingList.map((item, index) => (
                    <ListItem
                      key={`step-${index}-${item.item}`}
                      className="flex items-center justify-between py-2"
                    >
                      <Span className="mr-4">
                        {item.quantity} {item.item}
                      </Span>
                      <View className="flex space-x-2">
                        <Link
                          href={getSearchUrl("walmart", item.item)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="icon" className="w-20 h-10 p-0">
                            <Image
                              src="/walmart-logo.png"
                              alt="Walmart"
                              className="w-full h-full object-contain"
                              width={200}
                              height={100}
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
                              src="/amazon-logo.png"
                              alt="Amazon"
                              className="w-full h-full object-contain"
                              width={200}
                              height={100}
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
                              src="/wholefoods-logo.png"
                              alt="Whole Foods"
                              className="w-full h-full object-contain"
                              width={200}
                              height={100}
                            />
                          </Button>
                        </Link>
                      </View>
                    </ListItem>
                  ))}
                </UnorderedList>
              ) : null}
            </CardContent>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

const formSchema = z.object({
  dishName: z.string().min(3, "Dish name must be at least 3 characters"),
});

type FormValues = z.infer<typeof formSchema>;
