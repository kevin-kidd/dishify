import {
  P,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Span,
  Strong,
  H3,
  Image,
  LI,
  UL,
} from "@dishify/ui";
import { Skeleton } from "@dishify/ui/src/elements/skeleton";
import { getSearchUrl } from "app/utils/helpers";
import { View } from "react-native";
import { Link } from "solito/link";
import { useAtomValue } from "jotai";
import { recipeAtom } from "app/atoms/recipe";

export default function RecipeCard() {
  const recipe = useAtomValue(recipeAtom);
  return (
    <View className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Recipe {recipe.data && `- ${recipe.data?.dishName}`}</CardTitle>
        </CardHeader>
        <CardContent>
          {recipe.isLoading ? (
            <>
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
            </>
          ) : recipe.data ? (
            <>
              <P className="text-foreground">
                <Strong>Cooking Time:</Strong> {recipe.data.recipe.cookingTime}
              </P>
              <P className="text-foreground">
                <Strong>Servings:</Strong> {recipe.data.recipe.servings}
              </P>
              <H3 className="font-semibold mt-4 mb-2 text-foreground">Instructions:</H3>
              <UL>
                {recipe.data.recipe.instructions.map((step, index) => (
                  <LI key={`step-${index}-${step.slice(0, 5)}`} className="mb-2 text-foreground">
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
          {recipe.isLoading ? (
            <>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
            </>
          ) : recipe.data ? (
            <UL className="space-y-2">
              {recipe.data.shoppingList.map((item, index) => (
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
  );
}
