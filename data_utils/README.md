# Data Utils for Dishify

This directory contains utility scripts for processing and preparing recipe data for the Dishify project.

## Scripts

### 1. process-recipe-names.py

This script processes raw recipe names from a CSV file, cleaning and standardizing them.

Usage:

```bash
python process-recipe-names.py <input_file> [options]
```

Options:

- `--output`, `-o`: Name of the output file without extension (saved in data/sanitized directory)
- `--format`, `-f`: Output file format (csv or json, default: csv)
- `--column`, `-c`: Name of the column to process (default: name)

Example:

```bash
python process-recipe-names.py recipes.csv -o processed_recipes -f json -c recipe_name
```

### 2. generate-sql.py

This script generates an SQL file with INSERT statements for the processed recipe names.

Usage:

```bash
python generate-sql.py <input_file> [options]
```

Options:

- `--output`, `-o`: Name of the output SQL file (default: seed.sql)

Example:

```bash
python generate-sql.py processed_recipes.json -o recipe_seed.sql
```

## Workflow

1. Place your raw CSV file in the `data/raw` directory.
2. Run `process-recipe-names.py` to clean and process the recipe names.
3. Run `generate-sql.py` to create an SQL file with INSERT statements.
4. Use the generated SQL file in the API package to seed the database with Drizzle.

## Data Sources

The initial dataset used in this project is from Food.com, available on Kaggle:

- [Food.com Recipes and User Interactions](https://www.kaggle.com/datasets/shuyangli94/food-com-recipes-and-user-interactions?select=RAW_recipes.csv)

## Note

Ensure you have the required dependencies installed. You can install them using:

```bash
pip install -r requirements.txt
```
