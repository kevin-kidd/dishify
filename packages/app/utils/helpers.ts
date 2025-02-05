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
