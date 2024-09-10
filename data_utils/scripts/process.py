import pandas as pd
import os
import argparse
import json
from typing import List, Tuple, Set
import nltk
from nltk.corpus import words
from nltk.tag import pos_tag
from nltk.tokenize import word_tokenize
from collections import Counter
import multiprocessing
from lib.constants import (
    FILTER_WORDS,
    CULINARY_TERMS,
    CLEAN_REGEX,
    SPACE_REGEX,
)
from tqdm import tqdm

# Define fixed directories relative to the project root
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INPUT_DIR = os.path.join(PROJECT_ROOT, "data", "raw")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "data", "sanitized")

# Allowable single characters in recipe names
ALLOWED_SINGLE_CHARS: Set[str] = {"a", "&", "n", "o"}

# Download required NLTK resources
nltk.download("words", quiet=True)
nltk.download("averaged_perceptron_tagger_eng", quiet=True)
nltk.download("punkt_tab", quiet=True)

# Convert words corpus to a set for faster lookups
ENGLISH_WORDS: Set[str] = set(words.words())


def process_chunk(chunk: List[str]) -> Tuple[List[str], Counter, int]:
    """
    Process a chunk of recipe names in parallel.

    Args:
        chunk (List[str]): A subset of recipe names to process.

    Returns:
        Tuple[List[str], Counter, int]:
            - List of processed names
            - Counter of removal reasons
            - Number of names in the chunk
    """
    processed_names = []
    removal_reasons = Counter()
    for name in chunk:
        processed, reason = process_name(name)
        if processed:
            processed_names.append(processed)
        else:
            removal_reasons[reason] += 1
    return processed_names, removal_reasons, len(chunk)


def is_valid_recipe_name(name: str) -> bool:
    """
    Validate a recipe name based on various criteria.

    Args:
        name (str): The recipe name to validate.

    Returns:
        bool: True if the name is valid, False otherwise.

    Criteria:
    - Does not contain personal pronouns or proper nouns
    - Does not contain word from list of filter words
    - Contains at least one culinary term
    - Has at least two words
    """
    # Tokenize and get part-of-speech tags
    tokens = word_tokenize(name)
    pos_tags = pos_tag(tokens)

    # Check for personal pronouns and proper nouns
    if any(pos in ["PRP$", "NNP", "NNPS"] for _, pos in pos_tags):
        return False

    # Check for filler words
    if set(tokens).intersection(FILTER_WORDS):
        return False

    # Check if any culinary terms are present
    has_culinary_term = any(
        " ".join(tokens[i:j]).lower() in CULINARY_TERMS
        for i in range(len(tokens))
        for j in range(i + 1, len(tokens) + 1)
    )

    # Minimum word requirement
    min_words = 2

    return len(tokens) >= min_words and has_culinary_term


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


def process_name(name: str, max_length: int = 50) -> Tuple[str, str]:
    """
    Process a recipe name by cleaning, validating, and formatting.

    Args:
        name (str): The recipe name to process.
        max_length (int, optional): Maximum length of the processed name. Defaults to 50.

    Returns:
        Tuple[str, str]: The processed recipe name and a reason if invalid.

    Processing steps:
    1. Remove leading/trailing whitespace and convert to lowercase
    2. Replace non-allowed characters with spaces
    3. Check for profanity
    4. Remove single-character words (except allowed ones)
    5. Validate word count, length, and recipe name validity
    """
    if pd.isna(name):
        return "", "Empty or NaN"

    name = str(name).strip().lower()
    name = CLEAN_REGEX.sub(" ", name)  # Replace non-allowed characters with a space
    name = SPACE_REGEX.sub(" ", name)  # Replace multiple spaces with a single space

    words = name.split()

    # Check if name includes a number
    if any(char.isdigit() for char in name):
        return "", "Includes number"

    # Remove single-character words except those in ALLOWED_SINGLE_CHARS
    words = [word for word in words if len(word) > 1 or word in ALLOWED_SINGLE_CHARS]
    if len(words) != len(name.split()):
        return "", "Invalid single char"

    if len(words) > 5:
        return "", "More than 5 words"

    if not all(word in ENGLISH_WORDS or word in ALLOWED_SINGLE_CHARS for word in words):
        return "", "Non-English words"

    name = " ".join(words).strip()

    if len(name) <= 3:
        return "", "Too short"

    if len(name) > max_length:
        return "", f"Too long (>{max_length} chars)"

    if not is_valid_recipe_name(name):
        return "", "Invalid recipe name"

    return name, ""  # Return the processed name and an empty string for the reason


def process_recipe_names(
    df: pd.DataFrame, column_name: str, pbar: tqdm
) -> Tuple[List[str], Counter, int]:
    """
    Process recipe names from a DataFrame using parallel processing.

    Args:
        df (pd.DataFrame): DataFrame containing recipe names.
        column_name (str): Name of the column containing recipe names.
        pbar (tqdm): Progress bar object to update.

    Returns:
        Tuple[List[str], Counter, int]:
            - List of processed names
            - Counter of removal reasons
            - Total number of names processed
    """
    total_names = len(df[column_name])

    chunk_size = 1000
    chunks = [
        df[column_name][i : i + chunk_size] for i in range(0, total_names, chunk_size)
    ]

    processed_names = []
    removal_reasons = Counter()

    with multiprocessing.Pool(processes=multiprocessing.cpu_count()) as pool:
        results = pool.imap(process_chunk, chunks)
        for chunk_names, chunk_reasons, size in results:
            processed_names.extend(chunk_names)
            removal_reasons.update(chunk_reasons)
            pbar.update(size)

    return processed_names, removal_reasons, total_names


def save_to_csv(names: List[str], file_name: str) -> None:
    """
    Save processed recipe names to a CSV file.

    Args:
        names (List[str]): List of processed recipe names.
        file_name (str): Name of the output CSV file.
    """
    file_path = os.path.join(OUTPUT_DIR, file_name)
    df = pd.DataFrame(names, columns=["recipe_name"])
    df.to_csv(file_path, index=False)
    print(f"Saved {len(names)} unique recipe names to {file_path}")


def save_to_json(names: List[str], file_name: str) -> None:
    """
    Save processed recipe names to a JSON file.

    Args:
        names (List[str]): List of processed recipe names.
        file_name (str): Name of the output JSON file.
    """
    file_path = os.path.join(OUTPUT_DIR, file_name)
    with open(file_path, "w") as f:
        json.dump(names, f, indent=2)
    print(f"Saved {len(names)} unique recipe names to {file_path}")


def parse_arguments() -> argparse.Namespace:
    """
    Parse command-line arguments for the recipe name processing script.

    Returns:
        argparse.Namespace: Parsed command-line arguments.

    Arguments:
    - input: Comma-separated list of input CSV files with optional column names
    - output: Name of the output file (without extension)
    - format: Output file format (csv or json)
    - default-column: Default column name to use if not specified for a file
    """
    parser = argparse.ArgumentParser(description="Process recipe names from CSV files.")
    parser.add_argument(
        "input",
        help="Comma-separated list of input CSV file names with optional column names (format: filename:column_name or just filename)",
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Name of the output file without extension (will be saved in data/sanitized directory)",
    )
    parser.add_argument(
        "--format",
        "-f",
        choices=["csv", "json"],
        default="csv",
        help="Output file format (default: csv)",
    )
    parser.add_argument(
        "--default-column",
        "-d",
        default="name",
        help="Default column name to use if not specified for a file (default: name)",
    )
    return parser.parse_args()


if __name__ == "__main__":
    # Parse command-line arguments
    args = parse_arguments()

    # Process input files and their corresponding column names
    input_files = []
    for item in args.input.split(","):
        parts = item.strip().split(":")
        if len(parts) == 1:
            input_files.append((parts[0], args.default_column))
        elif len(parts) == 2:
            input_files.append((parts[0], parts[1]))
        else:
            print(
                f"Error: Invalid input format '{item}'. Use 'filename:column_name' or just 'filename'."
            )
            exit(1)

    # Ensure all input files have .csv extension
    input_files = [
        (name if name.endswith(".csv") else f"{name}.csv", column)
        for name, column in input_files
    ]
    output_file_name = args.output
    output_format = args.format

    # Apply the correct file extension based on the format
    if output_file_name:
        output_file_name = f"{output_file_name}.{output_format}"
    else:
        output_file_name = f"processed_recipes.{output_format}"

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Reading CSV file{len(input_files) > 1 and 's' or ''}...")
    dataframes = []
    total_rows = 0
    for file_name, column_name in input_files:
        df = read_csv(file_name)
        if column_name not in df.columns:
            print(f"Error: '{column_name}' column not found in the file '{file_name}'.")
            exit(1)
        total_rows += len(df[column_name])
        dataframes.append((df, column_name))

    all_processed_names = []
    all_removal_reasons = Counter()
    all_total_names = 0

    with tqdm(
        total=total_rows,
        desc="Processing recipes",
        unit="recipe",
        position=0,
        leave=True,
    ) as pbar:
        for df, column_name in dataframes:
            processed_names, removal_reasons, total_names = process_recipe_names(
                df, column_name, pbar
            )
            all_processed_names.extend(processed_names)
            all_removal_reasons.update(removal_reasons)
            all_total_names += total_names

    # Perform duplicate checking
    unique_names = set()
    all_removal_reasons["Duplicates"] = 0
    for name in all_processed_names:
        if name in unique_names:
            all_removal_reasons["Duplicates"] += 1
        else:
            unique_names.add(name)

    all_names_removed = all_total_names - len(unique_names)

    print("\n" + "=" * 30)
    print("Processing Summary")
    print("=" * 30)
    print(f"Total names processed: {all_total_names}")
    print(f"Total names removed: {all_names_removed}")
    print(f"Names kept: {len(unique_names)}")
    print("\nRemoval reasons:")
    print("-" * 30)
    for reason, count in all_removal_reasons.most_common():
        print(f"{reason:<20} - {count:>7}")
    print("-" * 30 + "\n")

    # Convert set back to list
    all_processed_names = list(unique_names)

    # Save processed names to file in the specified format
    if output_format == "csv":
        save_to_csv(all_processed_names, output_file_name)
    else:
        save_to_json(all_processed_names, output_file_name)
