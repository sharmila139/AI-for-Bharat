"""
Unit tests for image preprocessing pipeline.
"""

import pytest
import numpy as np
from PIL import Image
import io
from pathlib import Path
import tempfile

from image_preprocessing import (
    ImagePreprocessor,
    ImageAugmentor,
    create_soil_preprocessor,
    create_grievance_preprocessor
)


class TestImagePreprocessor:
    """Test cases for ImagePreprocessor class."""
    
    @pytest.fixture
    def preprocessor(self):
        """Create a standard preprocessor instance."""
        return ImagePreprocessor(target_size=(224, 224))
    
    @pytest.fixture
    def sample_image(self):
        """Create a sample RGB image."""
        return Image.new('RGB', (640, 480), color=(100, 150, 200))
    
    def test_init_default_params(self):
        """Test preprocessor initialization with default parameters."""
        preprocessor = ImagePreprocessor()
        assert preprocessor.target_size == (224, 224)
        assert preprocessor.normalize is True
        assert preprocessor.mean.shape == (1, 1, 3)
        assert preprocessor.std.shape == (1, 1, 3)
    
    def test_init_custom_params(self):
        """Test preprocessor initialization with custom parameters."""
        preprocessor = ImagePreprocessor(
            target_size=(128, 128),
            normalize=False,
            mean=(0.5, 0.5, 0.5),
            std=(0.5, 0.5, 0.5)
        )
        assert preprocessor.target_size == (128, 128)
        assert preprocessor.normalize is False
    
    def test_load_image_from_pil(self, preprocessor, sample_image):
        """Test loading image from PIL Image object."""
        loaded = preprocessor.load_image(sample_image)
        assert loaded is not None
        assert loaded.mode == 'RGB'
        assert loaded.size == sample_image.size
    
    def test_load_image_from_bytes(self, preprocessor, sample_image):
        """Test loading image from bytes."""
        # Convert image to bytes
        buffer = io.BytesIO()
        sample_image.save(buffer, format='PNG')
        image_bytes = buffer.getvalue()
        
        loaded = preprocessor.load_image(image_bytes)
        assert loaded is not None
        assert loaded.mode == 'RGB'
    
    def test_load_image_from_path(self, preprocessor, sample_image):
        """Test loading image from file path."""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            sample_image.save(tmp.name)
            tmp_path = tmp.name
        
        try:
            loaded = preprocessor.load_image(tmp_path)
            assert loaded is not None
            assert loaded.mode == 'RGB'
        finally:
            Path(tmp_path).unlink()
    
    def test_load_image_invalid_source(self, preprocessor):
        """Test loading image with invalid source type."""
        loaded = preprocessor.load_image(12345)
        assert loaded is None
    
    def test_resize_image(self, preprocessor, sample_image):
        """Test image resizing."""
        resized = preprocessor.resize_image(sample_image)
        assert resized.size == (224, 224)
    
    def test_normalize_array(self, preprocessor):
        """Test array normalization."""
        # Create test array with known values
        image_array = np.ones((224, 224, 3), dtype=np.uint8) * 128
        
        normalized = preprocessor.normalize_array(image_array)
        
        # Check shape is preserved
        assert normalized.shape == (224, 224, 3)
        
        # Check dtype is float32
        assert normalized.dtype == np.float32
        
        # Check values are normalized (should be around 0 for mid-gray)
        assert normalized.mean() < 1.0  # Should be normalized
    
    def test_normalize_array_without_normalization(self):
        """Test array normalization when normalize=False."""
        preprocessor = ImagePreprocessor(normalize=False)
        image_array = np.ones((224, 224, 3), dtype=np.uint8) * 255
        
        normalized = preprocessor.normalize_array(image_array)
        
        # Should just scale to [0, 1]
        assert normalized.max() == pytest.approx(1.0)
        assert normalized.min() == pytest.approx(1.0)
    
    def test_preprocess_returns_array(self, preprocessor, sample_image):
        """Test complete preprocessing returns numpy array."""
        result = preprocessor.preprocess(sample_image)
        
        assert result is not None
        assert isinstance(result, np.ndarray)
        assert result.shape == (224, 224, 3)
        assert result.dtype == np.float32
    
    def test_preprocess_returns_pil(self, preprocessor, sample_image):
        """Test preprocessing can return PIL image."""
        result = preprocessor.preprocess(sample_image, return_pil=True)
        
        assert result is not None
        assert isinstance(result, Image.Image)
        assert result.size == (224, 224)
    
    def test_preprocess_invalid_image(self, preprocessor):
        """Test preprocessing with invalid image."""
        result = preprocessor.preprocess("nonexistent_file.jpg")
        assert result is None
    
    def test_preprocess_batch_all_valid(self, preprocessor):
        """Test batch preprocessing with all valid images."""
        images = [
            Image.new('RGB', (640, 480), color=(i*50, i*50, i*50))
            for i in range(3)
        ]
        
        batch_array, valid_indices = preprocessor.preprocess_batch(images)
        
        assert batch_array.shape == (3, 224, 224, 3)
        assert valid_indices == [0, 1, 2]
    
    def test_preprocess_batch_some_invalid(self, preprocessor, sample_image):
        """Test batch preprocessing with some invalid images."""
        images = [
            sample_image,
            "nonexistent.jpg",  # Invalid
            sample_image
        ]
        
        batch_array, valid_indices = preprocessor.preprocess_batch(images)
        
        assert batch_array.shape == (2, 224, 224, 3)
        assert valid_indices == [0, 2]
    
    def test_preprocess_batch_all_invalid(self, preprocessor):
        """Test batch preprocessing with all invalid images."""
        images = ["invalid1.jpg", "invalid2.jpg"]
        
        batch_array, valid_indices = preprocessor.preprocess_batch(images)
        
        assert batch_array.shape == (0,)
        assert valid_indices == []


class TestImageAugmentor:
    """Test cases for ImageAugmentor class."""
    
    @pytest.fixture
    def sample_image(self):
        """Create a sample RGB image."""
        return Image.new('RGB', (224, 224), color=(100, 150, 200))
    
    def test_random_flip_horizontal(self, sample_image):
        """Test random horizontal flip."""
        # Set seed for reproducibility
        np.random.seed(42)
        
        flipped = ImageAugmentor.random_flip(sample_image, horizontal=True)
        assert flipped.size == sample_image.size
        assert flipped.mode == sample_image.mode
    
    def test_random_rotation(self, sample_image):
        """Test random rotation."""
        np.random.seed(42)
        
        rotated = ImageAugmentor.random_rotation(sample_image, max_angle=15)
        assert rotated.size == sample_image.size
        assert rotated.mode == sample_image.mode
    
    def test_random_brightness(self, sample_image):
        """Test random brightness adjustment."""
        np.random.seed(42)
        
        adjusted = ImageAugmentor.random_brightness(sample_image)
        assert adjusted.size == sample_image.size
        assert adjusted.mode == sample_image.mode
    
    def test_random_contrast(self, sample_image):
        """Test random contrast adjustment."""
        np.random.seed(42)
        
        adjusted = ImageAugmentor.random_contrast(sample_image)
        assert adjusted.size == sample_image.size
        assert adjusted.mode == sample_image.mode
    
    def test_apply_augmentations_all(self, sample_image):
        """Test applying all augmentations."""
        np.random.seed(42)
        
        augmented = ImageAugmentor.apply_augmentations(
            sample_image,
            flip=True,
            rotate=True,
            brightness=True,
            contrast=True
        )
        assert augmented.size == sample_image.size
        assert augmented.mode == sample_image.mode
    
    def test_apply_augmentations_selective(self, sample_image):
        """Test applying selective augmentations."""
        np.random.seed(42)
        
        augmented = ImageAugmentor.apply_augmentations(
            sample_image,
            flip=True,
            rotate=False,
            brightness=False,
            contrast=False
        )
        assert augmented.size == sample_image.size


class TestFactoryFunctions:
    """Test cases for factory functions."""
    
    def test_create_soil_preprocessor(self):
        """Test soil preprocessor factory."""
        preprocessor = create_soil_preprocessor()
        
        assert isinstance(preprocessor, ImagePreprocessor)
        assert preprocessor.target_size == (224, 224)
        assert preprocessor.normalize is True
    
    def test_create_grievance_preprocessor(self):
        """Test grievance preprocessor factory."""
        preprocessor = create_grievance_preprocessor()
        
        assert isinstance(preprocessor, ImagePreprocessor)
        assert preprocessor.target_size == (224, 224)
        assert preprocessor.normalize is True


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    def test_grayscale_image_conversion(self):
        """Test that grayscale images are converted to RGB."""
        preprocessor = ImagePreprocessor()
        gray_image = Image.new('L', (640, 480), color=128)
        
        loaded = preprocessor.load_image(gray_image)
        assert loaded.mode == 'RGB'
    
    def test_rgba_image_conversion(self):
        """Test that RGBA images are converted to RGB."""
        preprocessor = ImagePreprocessor()
        rgba_image = Image.new('RGBA', (640, 480), color=(100, 150, 200, 255))
        
        loaded = preprocessor.load_image(rgba_image)
        assert loaded.mode == 'RGB'
    
    def test_very_small_image(self):
        """Test preprocessing very small images."""
        preprocessor = ImagePreprocessor(target_size=(224, 224))
        small_image = Image.new('RGB', (10, 10), color=(100, 150, 200))
        
        result = preprocessor.preprocess(small_image)
        assert result is not None
        assert result.shape == (224, 224, 3)
    
    def test_very_large_image(self):
        """Test preprocessing very large images."""
        preprocessor = ImagePreprocessor(target_size=(224, 224))
        large_image = Image.new('RGB', (4000, 3000), color=(100, 150, 200))
        
        result = preprocessor.preprocess(large_image)
        assert result is not None
        assert result.shape == (224, 224, 3)
    
    def test_corrupted_bytes(self):
        """Test handling corrupted image bytes."""
        preprocessor = ImagePreprocessor()
        corrupted_bytes = b"not an image"
        
        result = preprocessor.load_image(corrupted_bytes)
        assert result is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
