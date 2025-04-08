#!/usr/bin/env python3
"""
Script to update Pydantic model configurations from 'orm_mode' to 'from_attributes'.
Run this from the root of your backend directory.
"""

import os
import re
import sys
from pathlib import Path

def find_py_files(directory):
    """Find all Python files in the given directory recursively."""
    return list(Path(directory).rglob("*.py"))

def fix_pydantic_config(file_path):
    """Update orm_mode to from_attributes in the given file."""
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Look for Config classes with from_attributes = True
    pattern1 = re.compile(r'class\s+Config\s*:.*?orm_mode\s*=\s*True', re.DOTALL)
    # Also look for config class with lowercase 'c'
    pattern2 = re.compile(r'class\s+config\s*:.*?orm_mode\s*=\s*True', re.DOTALL)
    
    # Check if the file contains orm_mode
    if 'orm_mode' in content:
        # Replace orm_mode with from_attributes
        modified_content = re.sub(r'orm_mode\s*=\s*True', 'from_attributes = True', content)
        
        if content != modified_content:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(modified_content)
            return True
    
    return False

def main():
    """Main function to find and fix Pydantic models."""
    # Get the backend directory
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Find all Python files
    py_files = find_py_files(backend_dir)
    
    # Track modified files
    modified_files = []
    
    # Process each file
    for file_path in py_files:
        if fix_pydantic_config(file_path):
            relative_path = os.path.relpath(file_path, backend_dir)
            modified_files.append(relative_path)
            print(f"Updated: {relative_path}")
    
    # Summary
    if modified_files:
        print(f"\nSuccessfully updated {len(modified_files)} file(s):")
        for file in modified_files:
            print(f"  - {file}")
    else:
        print("No files needed updating.")

if __name__ == "__main__":
    main()
