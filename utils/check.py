import json
import argparse
import sys

def load_json(file_path):
    """Load a JSON file and return its content"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found. Please check the file path.")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: File '{file_path}' is not a valid JSON format.")
        sys.exit(1)

def get_missing_keys(source, target):
    """Return a set of keys that exist in the target dictionary but are missing in the source dictionary"""
    return set(target.keys()) - set(source.keys())

def compare_json_files(file_a, file_b):
    """Compare the keys of two JSON files and print the keys missing in the first file"""
    data_a = load_json(file_a)
    data_b = load_json(file_b)

    missing_keys = get_missing_keys(data_a, data_b)

    if missing_keys:
        print("The following keys exist in the second file but are missing in the first file:")
        for key in missing_keys:
            print(f"- {key}")
    else:
        print("All keys in the second file are present in the first file.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Compare key differences between two JSON files")
    parser.add_argument("json_file_a", help="Path to the first JSON file")
    parser.add_argument("json_file_b", help="Path to the second JSON file")
    args = parser.parse_args()

    compare_json_files(args.json_file_a, args.json_file_b)
