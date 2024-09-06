from typing import Set

FILLER_WORDS: Set[str] = {
    "just",
    "great",
    "stuff",
    "my",
    "an",
    "best",
    "delicious",
    "yummy",
    "tasty",
    "favorite",
    "best",
    "simple",
    "quick",
    "amazing",
    "awesome",
    "perfect",
    "ultimate",
    "super",
    "really",
    "very",
    "truly",
    "absolutely",
    "incredibly",
    "wonderfully",
    "fantastic",
    "fabulous",
    "excellent",
    "literally",
    "amazingly",
    "perfectly",
    "incredible",
    "terrific",
    "magnificent",
    "wonderful",
    "delightful",
    "satisfying",
    "simply",
    "heavenly",
    "deliciously",
    "perfectly",
    "ugly",
    "wickedly",
    "easy",
    "friendly",
    "slightly",
    "lightly",
    "family",
    "refreshingly",
    "basic",
    "prickly",
    "bubbly",
    "bubly",
    "recipe",
    "no.",
}
CULINARY_TERMS: Set[str] = {
    # Cooking methods
    "bake",
    "roast",
    "fry",
    "grill",
    "boil",
    "steam",
    "sauté",
    "broil",
    "poach",
    "simmer",
    "braise",
    "stir-fry",
    "deep-fry",
    "pan-fry",
    "slow-cook",
    "pressure-cook",
    "barbecue",
    "smoke",
    "blanch",
    "caramelize",
    "flambe",
    "marinate",
    "pickle",
    # Dish types
    "soup",
    "stew",
    "salad",
    "sandwich",
    "casserole",
    "pie",
    "cake",
    "bread",
    "cookie",
    "pasta",
    "rice",
    "curry",
    "stir-fry",
    "roast",
    "burger",
    "wrap",
    "taco",
    "burrito",
    "pizza",
    "quiche",
    "omelette",
    "frittata",
    "risotto",
    "pilaf",
    "paella",
    "jambalaya",
    "chowder",
    "bisque",
    "smoothie",
    "shake",
    # Main ingredients
    "chicken",
    "beef",
    "pork",
    "lamb",
    "fish",
    "salmon",
    "tuna",
    "shrimp",
    "tofu",
    "egg",
    "cheese",
    "vegetable",
    "potato",
    "carrot",
    "broccoli",
    "spinach",
    "tomato",
    "onion",
    "garlic",
    "mushroom",
    "bean",
    "lentil",
    "quinoa",
    "avocado",
    "zucchini",
    "eggplant",
    "cauliflower",
    "pepper",
    # Fruits
    "apple",
    "banana",
    "orange",
    "lemon",
    "lime",
    "strawberry",
    "blueberry",
    "raspberry",
    "blackberry",
    "peach",
    "pear",
    "plum",
    "cherry",
    "mango",
    "pineapple",
    "coconut",
    "kiwi",
    "grape",
    "watermelon",
    "melon",
    # Grains and starches
    "rice",
    "pasta",
    "noodle",
    "bread",
    "flour",
    "oat",
    "barley",
    "quinoa",
    "couscous",
    "polenta",
    "cornmeal",
    "tortilla",
    "pita",
    # Dairy and alternatives
    "milk",
    "cream",
    "yogurt",
    "butter",
    "cheese",
    "sour cream",
    "almond milk",
    "coconut milk",
    "soy milk",
    "oat milk",
    # Seasonings and flavorings
    "herb",
    "spice",
    "salt",
    "pepper",
    "garlic",
    "onion",
    "ginger",
    "cinnamon",
    "cumin",
    "paprika",
    "oregano",
    "basil",
    "thyme",
    "rosemary",
    "curry",
    "chili",
    "mustard",
    "vinegar",
    "soy sauce",
    "honey",
    "maple syrup",
    # Meal types
    "breakfast",
    "lunch",
    "dinner",
    "brunch",
    "snack",
    "appetizer",
    "dessert",
    "side dish",
    "main course",
    "entree",
    # Dietary terms
    "vegan",
    "vegetarian",
    "gluten-free",
    "dairy-free",
    "keto",
    "paleo",
    "low-carb",
    "low-fat",
    "sugar-free",
    "whole30",
    "mediterranean",
    # Preparation terms
    "fresh",
    "slow cooker",
    "instant pot",
    "one-pot",
    "no-bake",
    "raw",
    "stuffed",
    "grilled",
    "roasted",
    "baked",
    "fried",
    "sautéed",
    "sauteed",
    "steamed",
    "pickled",
    "marinated",
    "barbecued",
    "grilled",
    "fried",
    "roasted",
    "broiled",
    "boiled",
    "simmered",
    "poached",
    "braised",
    "stewed",
    "smoked",
    "caramelized",
    "blanched",
    # Cuisine types
    "italian",
    "mexican",
    "chinese",
    "indian",
    "japanese",
    "thai",
    "french",
    "greek",
    "mediterranean",
    "american",
    "cajun",
    "creole",
    "korean",
    "vietnamese",
    "middle eastern",
    "spanish",
    "german",
    "british",
    # Seasonal and holiday terms
    "summer",
    "winter",
    "spring",
    "fall",
    "christmas",
    "thanksgiving",
    "halloween",
    "easter",
    "holiday",
    "party",
    # Texture and consistency
    "crispy",
    "crunchy",
    "creamy",
    "smooth",
    "chunky",
    "tender",
    "juicy",
    "moist",
    "fluffy",
    "chewy",
    "gooey",
    "sticky",
    # Cooking equipment
    "skillet",
    "pan",
    "pot",
    "oven",
    "grill",
    "slow cooker",
    "instant pot",
    "air fryer",
    "food processor",
    "blender",
    # Miscellaneous common terms
    "classic",
    "traditional",
    "fusion",
    "modern",
    "healthy",
    "comfort food",
    "gourmet",
    "rustic",
    "spicy",
    "sweet",
    "savory",
    "tangy",
    "zesty",
    "hearty",
    "light",
    "rich",
    "decadent",
    "indulgent",
    "refreshing",
    "satisfying",
    "nutritious",
    "wholesome",
    "filling",
    "colorful",
    "flavorful",
    "aromatic",
}