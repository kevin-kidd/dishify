import React from "react";
import { Card, Div } from "@dishify/ui/src";

export function RecipeCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden bg-white border-0 rounded-2xl shadow-lg animate-pulse">
      <Div className="flex flex-col h-full">
        <Div className="w-full aspect-video bg-sage-200" />
        <Div className="p-4 flex flex-col gap-2 flex-1">
          <Div>
            <Div className="h-6 w-3/4 bg-sage-200 rounded min-h-[3.5rem]" />
            <Div className="flex flex-row items-center gap-2 flex-wrap mt-1 mb-3">
              <Div className="h-4 w-4 bg-sage-200 rounded" />
              <Div className="h-4 w-24 bg-sage-200 rounded" />
            </Div>
            <Div className="h-4 w-full bg-sage-200 rounded mb-1" />
            <Div className="h-4 w-2/3 bg-sage-200 rounded min-h-[2.5rem]" />
          </Div>
          <Div className="h-10 w-32 bg-sage-200 rounded-full mt-4" />
        </Div>
      </Div>
    </Card>
  );
}
