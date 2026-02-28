"""
Grievance Photo Categorization - Data Preparation
Prepares and organizes grievance image dataset for training
"""

import os
import shutil
import random
from pathlib import Path
from typing import Tuple, List
import json

class GrievanceDatasetPreparation:
    """Prepare grievance image dataset for training"""
    
    def __init__(self, source_dir: str, output_dir: str):
        """
        Initialize dataset preparation
        
        Args:
            source_dir: Directory containing raw grievance images
            output_dir: Directory to save organized dataset
        """
        self.source_dir = source_dir
        self.output_dir = output_dir
        
        # Grievance categories (from Requirements 12.5)
        self.categories = [
            'roads',
            'water',
            'electricity',
            'drainage',
            'waste',
            'streetlights',
            'public_property',
            'health_facility',
            'education_facility'
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
            for category in self.categories:
                dir_path = os.path.join(self.output_dir, split, category)
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
        
        stats = {category: {'train': 0, 'val': 0, 'test': 0} for category in self.categories}
        
        for category in self.categories:
            source_path = os.path.join(self.source_dir, category)
            
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
                dest_dir = os.path.join(self.output_dir, split, category)
                
                for filename in files:
                    src = os.path.join(source_path, filename)
                    dst = os.path.join(dest_dir, filename)
                    shutil.copy2(src, dst)
                
                stats[category][split] = len(files)
            
            print(f"  {category}: {total} images (train: {len(splits['train'])}, val: {len(splits['val'])}, test: {len(splits['test'])})")
        
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
        
        for category in self.categories:
            for split in ['train', 'val', 'test']:
                total_stats[split] += stats[category][split]
        
        print(f"\nTotal images per split:")
        print(f"  Training:   {total_stats['train']:,}")
        print(f"  Validation: {total_stats['val']:,}")
        print(f"  Test:       {total_stats['test']:,}")
        print(f"  Total:      {sum(total_stats.values()):,}")
        
        print(f"\nImages per category:")
        for category in self.categories:
            total = sum(stats[category].values())
            print(f"  {category.replace('_', ' ').title():20s}: {total:,}")
        
        # Save report
        report_path = os.path.join(self.output_dir, 'dataset_report.json')
        report = {
            'categories': self.categories,
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
            for category in self.categories:
                dir_path = os.path.join(self.output_dir, split, category)
                
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


def create_sample_dataset(output_dir: str = './data/grievance_images'):
    """
    Create a sample dataset structure with placeholder information
    This is useful for testing when actual images are not available
    
    Args:
        output_dir: Directory to create sample dataset
    """
    print("\n" + "="*60)
    print("Creating Sample Dataset Structure")
    print("="*60)
    
    categories = [
        'roads',
        'water',
        'electricity',
        'drainage',
        'waste',
        'streetlights',
        'public_property',
        'health_facility',
        'education_facility'
    ]
    
    print("\nNote: This creates the directory structure only.")
    print("You need to populate it with actual grievance images.")
    print("\nExpected structure:")
    print(f"{output_dir}/")
    print("  raw/")
    for category in categories:
        print(f"    {category}/")
        print(f"      (place {category} grievance images here)")
    
    # Create raw directory structure
    for category in categories:
        dir_path = os.path.join(output_dir, 'raw', category)
        os.makedirs(dir_path, exist_ok=True)
    
    # Create README
    readme_content = """# Grievance Images Dataset

## Directory Structure

Place your grievance images in the following structure:

```
data/grievance_images/raw/
  roads/
    image1.jpg
    image2.jpg
    ...
  water/
    image1.jpg
    image2.jpg
    ...
  electricity/
    image1.jpg
    image2.jpg
    ...
  drainage/
    image1.jpg
    image2.jpg
    ...
  waste/
    image1.jpg
    image2.jpg
    ...
  streetlights/
    image1.jpg
    image2.jpg
    ...
  public_property/
    image1.jpg
    image2.jpg
    ...
  health_facility/
    image1.jpg
    image2.jpg
    ...
  education_facility/
    image1.jpg
    image2.jpg
    ...
```

## Category Descriptions

1. **Roads**: Road damage, potholes, cracks, broken pavements
2. **Water**: Water supply issues, leaks, contamination, pipe bursts
3. **Electricity**: Power outages, damaged lines, transformer issues
4. **Drainage**: Blocked drains, flooding, sewage overflow
5. **Waste**: Garbage accumulation, littering, overflowing bins
6. **Streetlights**: Non-functional or damaged streetlights
7. **Public Property**: Damaged parks, buildings, benches, public infrastructure
8. **Health Facility**: PHC issues, medical facility problems
9. **Education Facility**: School infrastructure issues, damaged classrooms

## Image Requirements

- Format: JPG, JPEG, PNG, or BMP
- Minimum resolution: 224x224 pixels
- Recommended: 500+ images per category
- Images should clearly show the infrastructure issue
- Include various lighting conditions and angles
- Ensure images are properly labeled by category

## Data Preparation

After placing images in the raw/ directory, run:

```bash
python data_preparation.py
```

This will organize images into train/val/test splits.

## Model Requirements

- Minimum 85% confidence threshold for auto-acceptance (Requirements 12.1)
- Model size must be <50MB for mobile deployment (Requirements 9.3)
- On-device inference for offline functionality
"""
    
    readme_path = os.path.join(output_dir, 'README.md')
    with open(readme_path, 'w') as f:
        f.write(readme_content)
    
    print(f"\n✓ Sample dataset structure created at: {output_dir}")
    print(f"✓ README created at: {readme_path}")
    print("\nNext steps:")
    print("1. Collect grievance images for each category")
    print(f"2. Place images in {output_dir}/raw/<category>/")
    print("3. Run: python data_preparation.py")


def main():
    """Main data preparation pipeline"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Prepare grievance image dataset')
    parser.add_argument(
        '--source',
        type=str,
        default='./data/grievance_images/raw',
        help='Source directory containing raw images'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='./data/grievance_images',
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
    print("Grievance Dataset Preparation")
    print("="*60)
    
    # Initialize preparation
    prep = GrievanceDatasetPreparation(args.source, args.output)
    
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
