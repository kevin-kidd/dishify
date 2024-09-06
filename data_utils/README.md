# Data Utils for Dishify

This directory contains utility scripts for processing and preparing recipe data for the Dishify project.

## Scripts

### 1. processs.py

This script processes raw recipe names from CSV files, cleaning and standardizing them.

**Usage:** `python -m scripts.process <input_files> [options]`

**Input:** Comma-separated list of input CSV file names with optional column names (format: filename:column_name or just filename)

**Options:**

- `--output`, `-o`: Name of the output file without extension (saved in data/sanitized directory)
- `--format`, `-f`: Output file format (csv or json, default: csv)
- `--default-column`, `-d`: Default column name to use if not specified for a file (default: name)

**Examples:**

```bash
python -m scripts.process recipes1.csv,recipes2:ingredient_name -o processed_recipes -f json
```

```bash
python -m scripts.process file1:recipe_name,file2,file3.csv:title -d ingredient
```

### 2. generate.py

This script generates an SQL file with INSERT statements for the processed recipe names.

**Usage:** `python -m scripts.generate <input_file> [options]`

**Options:**

- `--output`, `-o`: Name of the output SQL file (default: seed.sql)
- `--table`, `-t`: Name of the table to insert into (default: recipes)

**Example:**

```bash
python -m scripts.generate processed_recipes.json -o recipe_seed.sql -t english_recipes
```

## Workflow

1. Place your raw CSV file in the `data/raw` directory.
2. Run `processs.py` to clean and process the recipe names.
3. Run `generate.py` to create an SQL file with INSERT statements.
4. Use the generated SQL file in the API package to seed the database with Drizzle.

## Data Sources

- [Food.com Recipes and User Interactions](https://www.kaggle.com/datasets/shuyangli94/food-com-recipes-and-user-interactions?select=RAW_recipes.csv)
- [RecipeNLG](https://www.kaggle.com/datasets/paultimothymooney/recipenlg?select=RecipeNLG_dataset.csv)

## Note

Ensure you have the required dependencies installed. You can install them using:

```bash
pip install -e .
```
