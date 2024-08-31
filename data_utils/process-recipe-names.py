import pandas as pd
import re
import os
import argparse
import json
from typing import List

# Define fixed directories
INPUT_DIR = 'data/raw'
OUTPUT_DIR = 'data/sanitized'

ALLOWED_SINGLE_CHARS = {'a', '&', 'i', 'n', 'o'}

def read_csv(file_name: str) -> pd.DataFrame:
    """
    Read a CSV file from the input directory.

    Args:
        file_name (str): Name of the CSV file to read.

    Returns:
        pd.DataFrame: DataFrame containing the CSV data.

    Raises:
        SystemExit: If the file is not found, empty, or encounters other errors.
    """
    file_path = os.path.join(INPUT_DIR, file_name)
    try:
        return pd.read_csv(file_path)
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        exit(1)
    except pd.errors.EmptyDataError:
        print(f"Error: File '{file_path}' is empty.")
        exit(1)
    except Exception as e:
        print(f"Error reading CSV file: {str(e)}")
        exit(1)

def process_name(name: str, max_length: int = 80) -> str:
    """
    Process a recipe name by removing non-alphanumeric characters, extra spaces, and truncating.

    Args:
        name (str): The recipe name to process.
        max_length (int, optional): Maximum length of the processed name. Defaults to 80.

    Returns:
        str: The processed recipe name, or an empty string if the name is invalid.
    """
    if pd.isna(name):
        return ''
    name = str(name)
    name = name.strip().lower()  # Remove spaces at the beginning and end, and convert to lowercase
    name = re.sub(r'[^a-z0-9\s\'\-&]', ' ', name)   # Replace non-allowed characters with a space
    name = re.sub(r'\s+', ' ', name)  # Replace multiple spaces with a single space
    
    # Remove single-character words except those in ALLOWED_SINGLE_CHARS
    words = name.split()
    words = [word for word in words if len(word) > 1 or word in ALLOWED_SINGLE_CHARS or word.isdigit()]
    name = ' '.join(words)
    
    name = name.strip()  # Remove any spaces that might have ended up at the beginning or end
    
    # Remove names that are 3 characters or shorter
    if len(name) <= 3:
        return ''
    
    return name[:max_length]  # Truncate if longer than max_length

def process_recipe_names(file_name: str, column_name: str) -> List[str]:
    """
    Process recipe names from a CSV file.

    Args:
        file_name (str): Name of the CSV file to process.
        column_name (str): Name of the column containing recipe names.

    Returns:
        List[str]: List of unique processed recipe names.

    Raises:
        SystemExit: If the specified column is not found in the CSV file.
    """
    df = read_csv(file_name)
    
    if column_name not in df.columns:
        print(f"Error: '{column_name}' column not found in the CSV file.")
        exit(1)
    
    processed_names = {}
    for name in df[column_name]:
        processed = process_name(name)
        if processed:
            processed_names[processed] = None  # Using dict for efficient deduplication
    
    return list(processed_names.keys())

def save_to_csv(names: List[str], file_name: str) -> None:
    """
    Save processed recipe names to a CSV file.

    Args:
        names (List[str]): List of processed recipe names.
        file_name (str): Name of the output CSV file.
    """
    file_path = os.path.join(OUTPUT_DIR, file_name)
    df = pd.DataFrame(names, columns=['recipe_name'])
    df.to_csv(file_path, index=False)
    print(f"Saved {len(names)} recipe names to {file_path}")

def save_to_json(names: List[str], file_name: str) -> None:
    """
    Save processed recipe names to a JSON file.

    Args:
        names (List[str]): List of processed recipe names.
        file_name (str): Name of the output JSON file.
    """
    file_path = os.path.join(OUTPUT_DIR, file_name)
    with open(file_path, 'w') as f:
        json.dump(names, f, indent=2)
    print(f"Saved {len(names)} recipe names to {file_path}")

def parse_arguments():
    """
    Parse command-line arguments.

    Returns:
        argparse.Namespace: Parsed command-line arguments.
    """
    parser = argparse.ArgumentParser(description="Process recipe names from a CSV file.")
    parser.add_argument("input", help="Name of the input CSV file (in data/raw directory)")
    parser.add_argument("--output", "-o", help="Name of the output file without extension (will be saved in data/sanitized directory)")
    parser.add_argument("--format", "-f", choices=["csv", "json"], default="csv",
                        help="Output file format (default: csv)")
    parser.add_argument("--column", "-c", default="name",
                        help="Name of the column to process (default: name)")
    return parser.parse_args()

if __name__ == "__main__":
    # Parse command-line arguments
    args = parse_arguments()

    input_file_name = args.input
    output_file_name = args.output
    column_name = args.column
    output_format = args.format

    # Apply the correct file extension based on the format
    if output_file_name:
        output_file_name = f"{output_file_name}.{output_format}"
    else:
        input_name_without_ext = os.path.splitext(input_file_name)[0]
        output_file_name = f"processed_{input_name_without_ext}.{output_format}"

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Process recipe names
    processed_names = process_recipe_names(input_file_name, column_name)

    # Save processed names to file
    if output_format == "csv":
        save_to_csv(processed_names, output_file_name)
    else:
        save_to_json(processed_names, output_file_name)

    # Print summary
    print(f"\nProcessed {len(processed_names)} unique recipe names.")
    print("First 5 processed names:")
    for name in processed_names[:5]:
        print(name)
