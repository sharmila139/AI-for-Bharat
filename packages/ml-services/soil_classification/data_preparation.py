"""
Soil Type Classification - Data Preparation
Prepares and organizes soil image dataset for training
"""

import os
import shutil
import random
from pathlib import Path
from typing import Tuple, List
import json

class SoilDatasetPreparation:
    """Prepare soil image dataset for training"""
    
    def __init__(self, source_dir: str, output_dir: str):
        """
        Initialize dataset preparation
        
        Args:
            source_dir: Directory containing raw soil images
            output_dir: Directory to save organized dataset
        """
        self.source_dir = source_dir
        self.output_dir = output_dir
        
        self.soil_types = [
            'alluvial',
            'black',
            'red',
            'laterite',
            'desert',
            'mountain'
        ]
        
        self.split_ratios = {
            'train': 0.7,
            'val': 0.15,
            'test': 0.15
        }
    
    def create_directory_structure(self):
        """Create train/val/test directory structure"""
        print("\nCreating directory structure...")
        
        for split in ['train', 'val', 'test']:
            for soil_type in self.soil_types:
                dir_path = os.path.join(self.output_dir, split, soil_type)
                os.makedirs(dir_path, exist_ok=True)
        
        print(f"✓ Directory structure created at: {self.output_dir}")
    
    def organize_images(self, seed: int = 42):
        """
        Organize images into train/val/test splits
        
        Args:
            seed: Random seed for reproducibility
        """
        random.seed(seed)
        
        print("\nOrganizing images into train/val/test splits...")
        
        stats = {soil_type: {'train': 0, 'val': 0, 'test': 0} for soil_type in self.soil_types}
        
        for soil_type in self.soil_types:
            source_path = os.path.join(self.source_dir, soil_type)
            
            if not os.path.exists(source_path):
                print(f"⚠️  Warning: Source directory not found: {source_path}")
                continue
            
            # Get all image files
            image_files = [
                f for f in os.listdir(source_path)
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))
            ]
            
            if not image_files:
                print(f"⚠️  Warning: No images found in {source_path}")
                continue
            
            # Shuffle images
            random.shuffle(image_files)
            
            # Calculate split indices
            total = len(image_files)
            train_end = int(total * self.split_ratios['train'])
            val_end = train_end + int(total * self.split_ratios['val'])
            
            # Split images
            splits = {
                'train': image_files[:train_end],
                'val': image_files[train_end:val_end],
                'test': image_files[val_end:]
            }
            
            # Copy images to respective directories
            for split, files in splits.items():
                dest_dir = os.path.join(self.output_dir, split, soil_type)
                
                for filename in files:
                    src = os.path.join(source_path, filename)
                    dst = os.path.join(dest_dir, filename)
                    shutil.copy2(src, dst)
                
                stats[soil_type][split] = len(files)
            
            print(f"  {soil_type}: {total} images (train: {len(splits['train'])}, val: {len(splits['val'])}, test: {len(splits['test'])})")
        
        return stats
    
    def generate_dataset_report(self, stats: dict):
        """
        Generate dataset statistics report
        
        Args:
            stats: Dictionary containing dataset statistics
        """
        print("\n" + "="*60)
        print("Dataset Statistics")
        print("="*60)
        
        total_stats = {'train': 0, 'val': 0, 'test': 0}
        
        for soil_type in self.soil_types:
            for split in ['train', 'val', 'test']:
                total_stats[split] += stats[soil_type][split]
        
        print(f"\nTotal images per split:")
        print(f"  Training:   {total_stats['train']:,}")
        print(f"  Validation: {total_stats['val']:,}")
        print(f"  Test:       {total_stats['test']:,}")
        print(f"  Total:      {sum(total_stats.values()):,}")
        
        print(f"\nImages per soil type:")
        for soil_type in self.soil_types:
            total = sum(stats[soil_type].values())
            print(f"  {soil_type.capitalize():12s}: {total:,}")
        
        # Save report
        report_path = os.path.join(self.output_dir, 'dataset_report.json')
        report = {
            'soil_types': self.soil_types,
            'split_ratios': self.split_ratios,
            'statistics': stats,
            'totals': total_stats
        }
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n✓ Dataset report saved to: {report_path}")
    
    def validate_dataset(self) -> bool:
        """
        Validate that dataset is properly organized
        
        Returns:
            True if dataset is valid, False otherwise
        """
        print("\nValidating dataset...")
        
        valid = True
        
        for split in ['train', 'val', 'test']:
            for soil_type in self.soil_types:
                dir_path = os.path.join(self.output_dir, split, soil_type)
                
                if not os.path.exists(dir_path):
                    print(f"✗ Missing directory: {dir_path}")
                    valid = False
                    continue
                
                image_count = len([
                    f for f in os.listdir(dir_path)
                    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))
                ])
                
                if image_count == 0:
                    print(f"⚠️  Warning: No images in {dir_path}")
        
        if valid:
            print("✓ Dataset validation passed")
        else:
            print("✗ Dataset validation failed")
        
        return valid


def create_sample_dataset(output_dir: str = './data/soil_images'):
    """
    Create a sample dataset structure with placeholder information
    This is useful for testing when actual images are not available
    
    Args:
        output_dir: Directory to create sample dataset
    """
    print("\n" + "="*60)
    print("Creating Sample Dataset Structure")
    print("="*60)
    
    soil_types = ['alluvial', 'black', 'red', 'laterite', 'desert', 'mountain']
    
    print("\nNote: This creates the directory structure only.")
    print("You need to populate it with actual soil images.")
    print("\nExpected structure:")
    print(f"{output_dir}/")
    print("  raw/")
    for soil_type in soil_types:
        print(f"    {soil_type}/")
        print(f"      (place {soil_type} soil images here)")
    
    # Create raw directory structure
    for soil_type in soil_types:
        dir_path = os.path.join(output_dir, 'raw', soil_type)
        os.makedirs(dir_path, exist_ok=True)
    
    # Create README
    readme_content = """# Soil Images Dataset

## Directory Structure

Place your soil images in the following structure:

```
data/soil_images/raw/
  alluvial/
    image1.jpg
    image2.jpg
    ...
  black/
    image1.jpg
    image2.jpg
    ...
  red/
    image1.jpg
    image2.jpg
    ...
  laterite/
    image1.jpg
    image2.jpg
    ...
  desert/
    image1.jpg
    image2.jpg
    ...
  mountain/
    image1.jpg
    image2.jpg
    ...
```

## Soil Type Descriptions

1. **Alluvial**: Fertile soil deposited by rivers, good for most crops
2. **Black**: Cotton soil with high clay content, retains moisture
3. **Red**: Iron-rich soil with good drainage, suitable for various crops
4. **Laterite**: Acidic soil with low fertility, found in high rainfall areas
5. **Desert**: Sandy soil with low water retention
6. **Mountain**: Rocky soil with variable composition

## Image Requirements

- Format: JPG, JPEG, PNG, or BMP
- Minimum resolution: 224x224 pixels
- Recommended: 500+ images per soil type
- Images should show clear soil texture and color
- Avoid images with excessive vegetation or debris

## Data Preparation

After placing images in the raw/ directory, run:

```bash
python data_preparation.py
```

This will organize images into train/val/test splits.
"""
    
    readme_path = os.path.join(output_dir, 'README.md')
    with open(readme_path, 'w') as f:
        f.write(readme_content)
    
    print(f"\n✓ Sample dataset structure created at: {output_dir}")
    print(f"✓ README created at: {readme_path}")
    print("\nNext steps:")
    print("1. Collect soil images for each soil type")
    print(f"2. Place images in {output_dir}/raw/<soil_type>/")
    print("3. Run: python data_preparation.py")


def main():
    """Main data preparation pipeline"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Prepare soil image dataset')
    parser.add_argument(
        '--source',
        type=str,
        default='./data/soil_images/raw',
        help='Source directory containing raw images'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='./data/soil_images',
        help='Output directory for organized dataset'
    )
    parser.add_argument(
        '--create-sample',
        action='store_true',
        help='Create sample dataset structure'
    )
    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed for reproducibility'
    )
    
    args = parser.parse_args()
    
    if args.create_sample:
        create_sample_dataset(args.output)
        return
    
    print("="*60)
    print("Soil Dataset Preparation")
    print("="*60)
    
    # Initialize preparation
    prep = SoilDatasetPreparation(args.source, args.output)
    
    # Create directory structure
    prep.create_directory_structure()
    
    # Organize images
    stats = prep.organize_images(seed=args.seed)
    
    # Generate report
    prep.generate_dataset_report(stats)
    
    # Validate dataset
    prep.validate_dataset()
    
    print("\n✓ Data preparation complete!")


if __name__ == '__main__':
    main()
