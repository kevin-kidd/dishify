import { z } from "zod";

// Password helpers
const checkPasswordRequirements = (value: string) => {
  const requirements = [
    (v: string) => v.length, // This returns the length.
    (v: string) => (/[!@#$%^&*(),.?":{}|<>]/.test(v) ? 0 : 1),
    (v: string) => (/[A-Z]/.test(v) ? 0 : 1),
  ];
  // Create an array in which the first element is the length of the password, remaining element are 0 if no error is found, 1 if an error is found.
  // The 2nd element represents 1 special character, 3rd element represents 1 capital letter requirement.
  return requirements.map((test) => test(value));
};

export const passwordSchema = z.string().superRefine((value, ctx) => {
  const errors = checkPasswordRequirements(value);

  // The first item in the array represents the password length.
  // If it's less than 8 or any other values are 0, then add the issue.
  const passwordLength = errors[0] ?? 0;
  const hasPasswordLengthError = passwordLength < 8;
  const hasOtherErrors = errors.slice(1).some((error) => error === 1);
  if (hasPasswordLengthError || hasOtherErrors) {
    ctx.addIssue({
      code: "custom",
      message: JSON.stringify(errors),
    });
  }
});

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
