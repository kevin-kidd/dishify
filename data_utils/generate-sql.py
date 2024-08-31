import os
import json
import csv
import argparse
from typing import List

# Define constants for directory and table information
INPUT_DIR = 'data/sanitized'
OUTPUT_DIR = 'data'
TABLE_NAME = 'recipes'
COLUMN_NAME = 'name'

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

    if file_extension.lower() == '.json':
        with open(file_path, 'r') as f:
            return json.load(f)
    elif file_extension.lower() == '.csv':
        with open(file_path, 'r') as f:
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

def generate_sql_file(recipe_names: List[str], output_file: str):
    """
    Generate an SQL file with a single INSERT statement for all recipe names.

    Args:
        recipe_names (List[str]): List of recipe names to insert.
        output_file (str): Name of the output SQL file.
    """
    output_path = os.path.join(OUTPUT_DIR, output_file)
    with open(output_path, 'w') as f:
        f.write(f"-- Seed data for {TABLE_NAME} table\n\n")
        f.write(f"INSERT INTO {TABLE_NAME} ({COLUMN_NAME}) VALUES\n")
        
        # Generate VALUES part of the statement
        values = ",\n".join(f"('{escape_name(name)}')" for name in recipe_names)
        f.write(values)
        f.write(";\n")
    
    print(f"Generated SQL file: {output_path}")

def parse_arguments():
    """
    Parse command-line arguments.

    Returns:
        argparse.Namespace: Parsed command-line arguments.
    """
    parser = argparse.ArgumentParser(description="Generate SQL insert statements from processed recipe names.")
    parser.add_argument("input", help="Name of the input file (JSON or CSV) in the data/sanitized directory")
    parser.add_argument("--output", "-o", default="seed.sql", help="Name of the output SQL file (default: seed.sql)")
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_arguments()

    try:
        recipe_names = read_input_file(args.input)
        generate_sql_file(recipe_names, args.output)
        print(f"Successfully generated 1 INSERT statement with {len(recipe_names)} VALUES.")
    except Exception as e:
        print(f"Error: {str(e)}")
        exit(1)
