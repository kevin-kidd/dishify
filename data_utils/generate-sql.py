import os
import json
import csv
import argparse
from typing import List

# Define constants for directory and table information
INPUT_DIR = "data/sanitized"
OUTPUT_DIR = "data"
COLUMN_NAME = "name"


def read_input_file(file_name: str) -> List[str]:
    """
    Read recipe names from either a JSON or CSV file.

    Args:
        file_name (str): Name of the input file in the sanitized data directory.

    Returns:
        List[str]: A list of recipe names.

    Raises:
        ValueError: If the file format is not supported.
        FileNotFoundError: If the input file is not found.
    """
    file_path = os.path.join(INPUT_DIR, file_name)
    _, file_extension = os.path.splitext(file_name)

    if file_extension.lower() == ".json":
        with open(file_path, "r") as f:
            return json.load(f)
    elif file_extension.lower() == ".csv":
        with open(file_path, "r") as f:
            reader = csv.reader(f)
            next(reader)  # Skip header row
            return [row[0] for row in reader]
    else:
        raise ValueError(f"Unsupported file format: {file_extension}")


def escape_name(name: str) -> str:
    """
    Escape single quotes in recipe names for SQL insertion.

    Args:
        name (str): The recipe name to escape.

    Returns:
        str: The escaped recipe name.
    """
    return name.replace("'", "''")


def generate_sql_file(recipe_names: List[str], output_file: str, table_name: str):
    """
    Generate an SQL file with individual INSERT statements for each recipe name.

    Args:
        recipe_names (List[str]): List of recipe names to insert.
        output_file (str): Name of the output SQL file.
        table_name (str): Name of the table to insert into.
    """
    output_path = os.path.join(OUTPUT_DIR, output_file)
    with open(output_path, "w") as f:
        f.write(f"-- Seed data for {table_name} table\n\n")

        # Generate individual INSERT statements for each recipe name
        for name in recipe_names:
            f.write(
                f"INSERT INTO {table_name} ({COLUMN_NAME}) VALUES ('{escape_name(name)}');\n"
            )

    print(f"Generated SQL file: {output_path}")


def parse_arguments():
    """
    Parse command-line arguments.

    Returns:
        argparse.Namespace: Parsed command-line arguments.
    """
    parser = argparse.ArgumentParser(
        description="Generate SQL insert statements from processed recipe names."
    )
    parser.add_argument(
        "input",
        help="Name of the input file (JSON or CSV) in the data/sanitized directory",
    )
    parser.add_argument(
        "--output",
        "-o",
        default="seed.sql",
        help="Name of the output SQL file (default: seed.sql)",
    )
    parser.add_argument(
        "--table",
        "-t",
        default="recipes",
        help="Name of the table to insert into (default: recipes)",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_arguments()

    try:
        recipe_names = read_input_file(args.input)
        generate_sql_file(recipe_names, args.output, args.table)
        print(
            f"Successfully generated SQL file containing {len(recipe_names)} VALUES for table '{args.table}'."
        )
    except Exception as e:
        print(f"Error: {str(e)}")
        exit(1)
