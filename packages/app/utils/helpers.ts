export const parseErrorMessage = (error: Error) => {
  if (typeof error.message === "string") {
    try {
      const parsedError = JSON.parse(error.message);
      if (Array.isArray(parsedError) && parsedError.length > 0 && parsedError[0].message) {
        return parsedError[0].message;
      }
    } catch (e) {
      // If parsing fails, it's not a Zod error, so we'll use the original message
    }
  }
  return error.message || "An unknown error occurred";
};

/**
 * A utility function that wraps a promise and returns an object with data and error properties.
 * This allows for handling promises without try/catch blocks.
 *
 * @param promise - The promise to be executed
 * @returns An object with data (if successful) and error (if failed) properties
 *
 * @example
 * // Basic usage
 * const { data, error } = await tryCatch(somePromise());
 * if (error) {
 *   // Handle error
 * } else {
 *   // Use data
 * }
 *
 * @example
 * // With error logging
 * const { data, error } = await tryCatch(someAsyncOperation());
 * if (error) {
 *   console.error("Operation failed:", error);
 *   // Handle error or return early
 *   return;
 * }
 * // Continue with data
 *
 * @example
 * // For cleanup operations where errors should be logged but not thrown
 * const { error: cleanupError } = await tryCatch(cleanupOperation());
 * if (cleanupError) {
 *   console.error("Cleanup failed:", cleanupError);
 *   // Continue execution, don't throw
 * }
 *
 * @warning
 * Avoid nesting tryCatch calls. If you're using tryCatch inside a function that will be
 * called with tryCatch, simply let the error propagate to the caller instead of catching
 * and re-throwing it.
 */
export const tryCatch = async <T>(
  promise: Promise<T>,
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

// Shopping list helpers
export const getSearchUrl = (store: string, item: string) => {
  const query = encodeURIComponent(item);
  switch (store) {
    case "walmart":
      return `https://www.walmart.com/search?q=${query}`;
    case "amazon":
      return `https://www.amazon.com/s?k=${query}`;
    case "wholefoods":
      return `https://www.wholefoodsmarket.com/search?text=${query}`;
    default:
      return "#";
  }
};

/**
 * A safer version of parseErrorMessage
 *
 * @param error - The error to parse
 * @returns The parsed error message or a default message
 */
export const safeParseErrorMessage = (error: Error): string => {
  if (typeof error.message !== "string") {
    return "An unknown error occurred";
  }

  try {
    const parsedError = JSON.parse(error.message);
    if (Array.isArray(parsedError) && parsedError.length > 0 && parsedError[0].message) {
      return parsedError[0].message;
    }
  } catch {
    // If parsing fails, it's not a Zod error, so we'll use the original message
  }

  return error.message || "An unknown error occurred";
};
