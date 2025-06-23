#!/usr/bin/env python3
"""
PNG to WebP Converter Script

This script converts all PNG files in the workspace to WebP format.
It preserves the original directory structure and allows customization of quality settings.
"""

import os
import sys
from pathlib import Path
from PIL import Image
import argparse

def convert_png_to_webp(png_path, quality=85, lossless=False, keep_original=True):
    """
    Convert a single PNG file to WebP format.
    
    Args:
        png_path (Path): Path to the PNG file
        quality (int): Quality for lossy compression (1-100, default: 85)
        lossless (bool): Use lossless compression (default: False)
        keep_original (bool): Keep the original PNG file (default: True)
    
    Returns:
        bool: True if conversion successful, False otherwise
    """
    try:
        # Create output path with .webp extension
        webp_path = png_path.with_suffix('.webp')
        
        # Open and convert the image
        with Image.open(png_path) as img:
            # Convert RGBA to RGB if necessary for better compression
            if img.mode in ('RGBA', 'LA'):
                # Create a white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[-1])  # Use alpha channel as mask
                else:
                    background.paste(img, mask=img.split()[-1])
                img = background
            elif img.mode == 'P':
                img = img.convert('RGB')
            
            # Save as WebP
            if lossless:
                img.save(webp_path, 'WebP', lossless=True)
            else:
                img.save(webp_path, 'WebP', quality=quality, optimize=True)
        
        # Get file sizes for comparison
        original_size = png_path.stat().st_size
        webp_size = webp_path.stat().st_size
        compression_ratio = (1 - webp_size / original_size) * 100
        
        print(f"✓ {png_path.name} -> {webp_path.name}")
        print(f"  Size: {original_size:,} bytes -> {webp_size:,} bytes ({compression_ratio:.1f}% reduction)")
        
        # Remove original file if requested
        if not keep_original:
            png_path.unlink()
            print(f"  Removed original: {png_path.name}")
        
        return True
        
    except Exception as e:
        print(f"✗ Failed to convert {png_path.name}: {str(e)}")
        return False

def find_png_files(root_dir):
    """
    Find all PNG files in the given directory and subdirectories.
    
    Args:
        root_dir (Path): Root directory to search
    
    Returns:
        list: List of Path objects for PNG files
    """
    png_files = []
    for png_file in root_dir.rglob('*.png'):
        if png_file.is_file():
            png_files.append(png_file)
    
    return sorted(png_files)

def main():
    parser = argparse.ArgumentParser(description='Convert PNG files to WebP format')
    parser.add_argument('--quality', '-q', type=int, default=85, 
                       help='Quality for lossy compression (1-100, default: 85)')
    parser.add_argument('--lossless', '-l', action='store_true',
                       help='Use lossless compression')
    parser.add_argument('--remove-original', '-r', action='store_true',
                       help='Remove original PNG files after conversion')
    parser.add_argument('--directory', '-d', type=str, default='.',
                       help='Directory to search for PNG files (default: current directory)')
    
    args = parser.parse_args()
    
    # Validate quality parameter
    if not (1 <= args.quality <= 100):
        print("Error: Quality must be between 1 and 100")
        sys.exit(1)
    
    # Check if Pillow is installed
    try:
        import PIL
    except ImportError:
        print("Error: Pillow library is required. Install it with:")
        print("pip install Pillow")
        sys.exit(1)
    
    # Get the root directory
    root_dir = Path(args.directory).resolve()
    if not root_dir.exists():
        print(f"Error: Directory '{root_dir}' does not exist")
        sys.exit(1)
    
    print(f"Searching for PNG files in: {root_dir}")
    
    # Find all PNG files
    png_files = find_png_files(root_dir)
    
    if not png_files:
        print("No PNG files found in the specified directory.")
        return
    
    print(f"Found {len(png_files)} PNG files to convert")
    print("=" * 50)
    
    # Convert each file
    successful_conversions = 0
    total_original_size = 0
    total_webp_size = 0
    
    for png_file in png_files:
        print(f"\nProcessing: {png_file.relative_to(root_dir)}")
        
        if convert_png_to_webp(png_file, 
                              quality=args.quality, 
                              lossless=args.lossless,
                              keep_original=not args.remove_original):
            successful_conversions += 1
            
            # Track file sizes
            total_original_size += png_file.stat().st_size
            webp_file = png_file.with_suffix('.webp')
            if webp_file.exists():
                total_webp_size += webp_file.stat().st_size
    
    # Summary
    print("\n" + "=" * 50)
    print(f"Conversion completed!")
    print(f"Successfully converted: {successful_conversions}/{len(png_files)} files")
    
    if total_original_size > 0:
        total_compression = (1 - total_webp_size / total_original_size) * 100
        print(f"Total size reduction: {total_original_size:,} -> {total_webp_size:,} bytes")
        print(f"Overall compression: {total_compression:.1f}%")
    
    if args.lossless:
        print("Compression mode: Lossless")
    else:
        print(f"Compression mode: Lossy (quality: {args.quality})")

if __name__ == "__main__":
    main()
