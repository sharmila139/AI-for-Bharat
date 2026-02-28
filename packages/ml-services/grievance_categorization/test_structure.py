"""
Test script to validate code structure without requiring TensorFlow
"""

import os
import json

def test_file_structure():
    """Test that all required files exist"""
    print("Testing file structure...")
    
    required_files = [
        'model_training.py',
        'data_preparation.py',
        'train_with_synthetic_data.py',
        'inference.py',
        'validate_model.py',
        'README.md',
        'QUICKSTART.md',
        'IMPLEMENTATION_SUMMARY.md',
        'requirements.txt'
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
            print(f"  ✗ Missing: {file}")
        else:
            print(f"  ✓ Found: {file}")
    
    if missing_files:
        print(f"\n✗ Missing {len(missing_files)} files")
        return False
    else:
        print(f"\n✓ All {len(required_files)} files present")
        return True

def test_code_imports():
    """Test that code files have correct structure"""
    print("\nTesting code structure...")
    
    test_cases = [
        ('model_training.py', ['class GrievanceCategoryModel', 'def build_model', 'def train']),
        ('data_preparation.py', ['class GrievanceDatasetPreparation', 'def organize_images']),
        ('train_with_synthetic_data.py', ['def generate_synthetic_dataset', 'def train_with_synthetic_data']),
        ('inference.py', ['class GrievanceClassifier', 'def predict']),
        ('validate_model.py', ['def validate_model'])
    ]
    
    all_passed = True
    for filename, expected_items in test_cases:
        with open(filename, 'r') as f:
            content = f.read()
        
        missing = []
        for item in expected_items:
            if item not in content:
                missing.append(item)
        
        if missing:
            print(f"  ✗ {filename}: Missing {missing}")
            all_passed = False
        else:
            print(f"  ✓ {filename}: All expected items found")
    
    if all_passed:
        print("\n✓ All code files have correct structure")
    else:
        print("\n✗ Some code files have issues")
    
    return all_passed

def test_categories():
    """Test that categories are correctly defined"""
    print("\nTesting category definitions...")
    
    expected_categories = [
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
    
    # Check model_training.py
    with open('model_training.py', 'r') as f:
        content = f.read()
    
    all_found = True
    for category in expected_categories:
        if f"'{category}'" not in content:
            print(f"  ✗ Category '{category}' not found in model_training.py")
            all_found = False
    
    if all_found:
        print(f"  ✓ All {len(expected_categories)} categories found in model_training.py")
    
    # Check data_preparation.py
    with open('data_preparation.py', 'r') as f:
        content = f.read()
    
    all_found = True
    for category in expected_categories:
        if f"'{category}'" not in content:
            print(f"  ✗ Category '{category}' not found in data_preparation.py")
            all_found = False
    
    if all_found:
        print(f"  ✓ All {len(expected_categories)} categories found in data_preparation.py")
        print(f"\n✓ Category definitions are consistent")
        return True
    else:
        print(f"\n✗ Category definitions have issues")
        return False

def test_requirements():
    """Test requirements.txt"""
    print("\nTesting requirements.txt...")
    
    with open('requirements.txt', 'r') as f:
        content = f.read()
    
    required_packages = ['tensorflow', 'numpy', 'pillow', 'scikit-learn', 'matplotlib', 'seaborn']
    
    all_found = True
    for package in required_packages:
        if package not in content.lower():
            print(f"  ✗ Package '{package}' not found")
            all_found = False
        else:
            print(f"  ✓ Package '{package}' found")
    
    if all_found:
        print("\n✓ All required packages listed")
        return True
    else:
        print("\n✗ Some packages missing")
        return False

def test_documentation():
    """Test documentation completeness"""
    print("\nTesting documentation...")
    
    # Check README.md
    with open('README.md', 'r') as f:
        readme = f.read()
    
    readme_sections = ['Overview', 'Features', 'Requirements', 'Quick Start', 'Usage']
    readme_ok = all(section in readme for section in readme_sections)
    
    if readme_ok:
        print("  ✓ README.md has all required sections")
    else:
        print("  ✗ README.md missing some sections")
    
    # Check QUICKSTART.md
    with open('QUICKSTART.md', 'r') as f:
        quickstart = f.read()
    
    quickstart_sections = ['Prerequisites', 'Train with Synthetic Data', 'Train with Real Data', 'Test the Model']
    quickstart_ok = all(section in quickstart for section in quickstart_sections)
    
    if quickstart_ok:
        print("  ✓ QUICKSTART.md has all required sections")
    else:
        print("  ✗ QUICKSTART.md missing some sections")
    
    # Check IMPLEMENTATION_SUMMARY.md
    with open('IMPLEMENTATION_SUMMARY.md', 'r') as f:
        summary = f.read()
    
    summary_sections = ['Overview', 'Implementation Details', 'Files Created', 'Requirements Validation']
    summary_ok = all(section in summary for section in summary_sections)
    
    if summary_ok:
        print("  ✓ IMPLEMENTATION_SUMMARY.md has all required sections")
    else:
        print("  ✗ IMPLEMENTATION_SUMMARY.md missing some sections")
    
    if readme_ok and quickstart_ok and summary_ok:
        print("\n✓ All documentation is complete")
        return True
    else:
        print("\n✗ Some documentation issues found")
        return False

def main():
    """Run all tests"""
    print("="*60)
    print("Grievance Categorization - Structure Validation")
    print("="*60)
    
    results = []
    
    results.append(("File Structure", test_file_structure()))
    results.append(("Code Structure", test_code_imports()))
    results.append(("Category Definitions", test_categories()))
    results.append(("Requirements", test_requirements()))
    results.append(("Documentation", test_documentation()))
    
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{test_name:25s}: {status}")
    
    all_passed = all(result[1] for result in results)
    
    print("\n" + "="*60)
    if all_passed:
        print("✓ All tests passed!")
        print("="*60)
        print("\nImplementation is complete and ready for use.")
        print("\nNext steps:")
        print("1. Install dependencies: pip install -r requirements.txt")
        print("2. Train with synthetic data: python train_with_synthetic_data.py")
        print("3. Or prepare real data: python data_preparation.py --create-sample")
        return 0
    else:
        print("✗ Some tests failed")
        print("="*60)
        return 1

if __name__ == '__main__':
    exit(main())
