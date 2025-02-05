import { useCallback, useRef, useEffect } from "react";
import { Printer } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, cn, Div } from "@dishify/ui";
import { toast } from "app/utils/toast";
import type { EnglishRecipe } from "@dishify/api/src/db/schema/recipes";

interface PrintButtonProps {
  recipe: EnglishRecipe;
  className?: string;
  onClick?: () => Promise<void>;
}

export function PrintButton({ recipe, className, onClick }: PrintButtonProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Create a hidden iframe for printing
  useEffect(() => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    return () => {
      if (iframeRef.current) {
        document.body.removeChild(iframeRef.current);
      }
    };
  }, []);

  const handlePrint = useCallback(async () => {
    try {
      if (onClick) {
        await onClick();
      }

      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) {
        throw new Error("Print frame not available");
      }

      // Generate print-friendly HTML
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${recipe.name} Recipe</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="format-detection" content="telephone=no">
            <meta name="robots" content="noindex">
            <meta name="color-scheme" content="light">
            <style>
              @media print {
                @page {
                  size: letter;
                  /* Remove all margins to prevent headers/footers */
                  margin: 0;
                }
                /* Hide all headers and footers */
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  /* Add padding to compensate for removed page margins */
                  padding: 1cm !important;
                  margin: 0 !important;
                }
                /* Force background colors and images to print */
                * {
                  -webkit-print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
              /* Base styles */
              html, body {
                margin: 0;
                padding: 0;
                background: white;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                line-height: 1.5;
                max-width: 800px;
                margin: 0 auto;
                padding: 2rem;
              }
              h1 {
                font-size: 2rem;
                font-weight: bold;
                margin-bottom: 1rem;
                color: #333;
              }
              h2 {
                font-size: 1.5rem;
                font-weight: 600;
                margin: 2rem 0 1rem;
                color: #444;
              }
              .recipe-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 2rem;
                margin: 1rem 0;
                color: #666;
              }
              .ingredients {
                background: #f9fafb;
                padding: 1.5rem;
                border-radius: 0.5rem;
                margin: 1rem 0;
              }
              .ingredients ul {
                list-style-type: none;
                padding: 0;
                margin: 0;
              }
              .ingredients li {
                padding: 0.5rem 0;
                border-bottom: 1px solid #eee;
              }
              .ingredients li:last-child {
                border-bottom: none;
              }
              .instructions {
                counter-reset: step;
              }
              .instruction-step {
                position: relative;
                padding-left: 2.5rem;
                margin-bottom: 1rem;
              }
              .instruction-step::before {
                counter-increment: step;
                content: counter(step);
                position: absolute;
                left: 0;
                top: 0;
                width: 1.75rem;
                height: 1.75rem;
                background: #f3f4f6;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 0.875rem;
                color: #4b5563;
              }
              .print-footer {
                margin-top: 3rem;
                padding-top: 1rem;
                border-top: 1px solid #eee;
                font-size: 0.75rem;
                color: #666;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .print-footer p {
                margin: 0.25rem 0;
              }
              /* Prevent page breaks inside elements */
              .recipe-meta,
              .ingredients,
              .instruction-step {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              /* Force page breaks before sections if needed */
              .ingredients,
              .instructions {
                page-break-before: auto;
                break-before: auto;
              }
              @media (max-width: 600px) {
                body {
                  padding: 1rem;
                }
                .recipe-meta {
                  flex-direction: column;
                  gap: 1rem;
                }
              }
            </style>
          </head>
          <body>
            <h1>${recipe.name}</h1>
            
            <div class="recipe-meta">
              <div>Cuisine: ${recipe.data?.cuisine}</div>
              <div>Cooking Time: ${recipe.data?.cookingTime}</div>
              <div>Servings: ${recipe.data?.servings}</div>
            </div>

            <h2>Ingredients</h2>
            <div class="ingredients">
              <ul>
                ${recipe.data?.shoppingList
                  .map(
                    (item) => `
                  <li>
                    <strong>${item.quantity}</strong> ${item.item}
                  </li>
                `,
                  )
                  .join("")}
              </ul>
            </div>

            <h2>Instructions</h2>
            <div class="instructions">
              ${recipe.data?.instructions
                .map(
                  (instruction) => `
                <div class="instruction-step">
                  ${instruction}
                </div>
              `,
                )
                .join("")}
            </div>

            <div class="print-footer">
              <p>Printed from Dishify • ${new Date().toLocaleDateString()}</p>
              <p>Find this recipe at: ${window.location.href}</p>
            </div>
          </body>
        </html>
      `;

      // Write content to the iframe
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(printContent);
      iframe.contentWindow.document.close();

      // Wait for content to load
      iframe.onload = () => {
        // Trigger print dialog
        iframe.contentWindow?.print();
      };
    } catch (error) {
      console.error("Failed to print:", error);

      toast.error("Failed to print recipe");
    }
  }, [recipe, onClick]);

  if (typeof window === "undefined") return null;

  return (
    <Tooltip>
      <TooltipTrigger>
        <Div
          className={cn(
            "hidden hover:cursor-pointer md:flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all duration-200",
            className,
          )}
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4 text-gray-600" />

          <span className="sr-only">Print Recipe</span>
        </Div>
      </TooltipTrigger>
      <TooltipContent position="top">Print Recipe</TooltipContent>
    </Tooltip>
  );
}
