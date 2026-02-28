"""
Image Preprocessing Pipeline for RuralConnect AI

This module provides a unified image preprocessing pipeline for both
soil classification and grievance categorization models.

Features:
- Image loading and validation
- Resizing and normalization
- Data augmentation for training
- Batch preprocessing
- Error handling for corrupted images
"""

import numpy as np
from PIL import Image
import io
from typing import Tuple, Optional, Union, List
from pathlib import Path


class ImagePreprocessor:
    """
    Unified image preprocessing pipeline for ML models.
    
    Supports both soil classification and grievance categorization models
    with configurable target sizes and normalization strategies.
    """
    
    def __init__(
        self,
        target_size: Tuple[int, int] = (224, 224),
        normalize: bool = True,
        mean: Tuple[float, float, float] = (0.485, 0.456, 0.406),
        std: Tuple[float, float, float] = (0.229, 0.224, 0.225)
    ):
        """
        Initialize the image preprocessor.
        
        Args:
            target_size: Target image dimensions (height, width)
            normalize: Whether to normalize pixel values
            mean: Mean values for normalization (ImageNet defaults)
            std: Standard deviation values for normalization (ImageNet defaults)
        """
        self.target_size = target_size
        self.normalize = normalize
        self.mean = np.array(mean).reshape(1, 1, 3)
        self.std = np.array(std).reshape(1, 1, 3)
    
    def load_image(
        self,
        image_source: Union[str, Path, bytes, Image.Image]
    ) -> Optional[Image.Image]:
        """
        Load an image from various sources.
        
        Args:
            image_source: Can be a file path, bytes, or PIL Image
            
        Returns:
            PIL Image object or None if loading fails
        """
        try:
            if isinstance(image_source, (str, Path)):
                # Load from file path
                return Image.open(image_source).convert('RGB')
            elif isinstance(image_source, bytes):
                # Load from bytes
                return Image.open(io.BytesIO(image_source)).convert('RGB')
            elif isinstance(image_source, Image.Image):
                # Already a PIL Image
                return image_source.convert('RGB')
            else:
                raise ValueError(f"Unsupported image source type: {type(image_source)}")
        except Exception as e:
            print(f"Error loading image: {e}")
            return None
    
    def resize_image(self, image: Image.Image) -> Image.Image:
        """
        Resize image to target size using high-quality resampling.
        
        Args:
            image: PIL Image object
            
        Returns:
            Resized PIL Image
        """
        return image.resize(self.target_size, Image.Resampling.LANCZOS)
    
    def normalize_array(self, image_array: np.ndarray) -> np.ndarray:
        """
        Normalize image array using ImageNet statistics.
        
        Args:
            image_array: Numpy array with shape (H, W, 3) and values in [0, 255]
            
        Returns:
            Normalized array with values approximately in [-2, 2]
        """
        # Convert to float and scale to [0, 1]
        image_array = image_array.astype(np.float32) / 255.0
        
        # Apply normalization
        if self.normalize:
            image_array = (image_array - self.mean.astype(np.float32)) / self.std.astype(np.float32)
        
        return image_array.astype(np.float32)
    
    def preprocess(
        self,
        image_source: Union[str, Path, bytes, Image.Image],
        return_pil: bool = False
    ) -> Optional[np.ndarray]:
        """
        Complete preprocessing pipeline for a single image.
        
        Args:
            image_source: Image to preprocess
            return_pil: If True, return PIL Image instead of numpy array
            
        Returns:
            Preprocessed image as numpy array (H, W, 3) or PIL Image, or None if failed
        """
        # Load image
        image = self.load_image(image_source)
        if image is None:
            return None
        
        # Resize
        image = self.resize_image(image)
        
        # Return PIL image if requested
        if return_pil:
            return image
        
        # Convert to numpy array
        image_array = np.array(image)
        
        # Normalize
        image_array = self.normalize_array(image_array)
        
        return image_array
    
    def preprocess_batch(
        self,
        image_sources: List[Union[str, Path, bytes, Image.Image]]
    ) -> Tuple[np.ndarray, List[int]]:
        """
        Preprocess a batch of images.
        
        Args:
            image_sources: List of images to preprocess
            
        Returns:
            Tuple of (batch_array, valid_indices)
            - batch_array: Numpy array with shape (N, H, W, 3)
            - valid_indices: List of indices that were successfully processed
        """
        processed_images = []
        valid_indices = []
        
        for idx, image_source in enumerate(image_sources):
            image_array = self.preprocess(image_source)
            if image_array is not None:
                processed_images.append(image_array)
                valid_indices.append(idx)
        
        if not processed_images:
            return np.array([]), []
        
        # Stack into batch
        batch_array = np.stack(processed_images, axis=0)
        
        return batch_array, valid_indices


class ImageAugmentor:
    """
    Image augmentation for training data.
    
    Provides various augmentation techniques to improve model robustness.
    """
    
    @staticmethod
    def random_flip(image: Image.Image, horizontal: bool = True) -> Image.Image:
        """Randomly flip image horizontally or vertically."""
        if np.random.random() > 0.5:
            if horizontal:
                return image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            else:
                return image.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
        return image
    
    @staticmethod
    def random_rotation(image: Image.Image, max_angle: int = 15) -> Image.Image:
        """Randomly rotate image within specified angle range."""
        angle = np.random.uniform(-max_angle, max_angle)
        return image.rotate(angle, resample=Image.Resampling.BILINEAR, expand=False)
    
    @staticmethod
    def random_brightness(image: Image.Image, factor_range: Tuple[float, float] = (0.8, 1.2)) -> Image.Image:
        """Randomly adjust image brightness."""
        from PIL import ImageEnhance
        factor = np.random.uniform(*factor_range)
        enhancer = ImageEnhance.Brightness(image)
        return enhancer.enhance(factor)
    
    @staticmethod
    def random_contrast(image: Image.Image, factor_range: Tuple[float, float] = (0.8, 1.2)) -> Image.Image:
        """Randomly adjust image contrast."""
        from PIL import ImageEnhance
        factor = np.random.uniform(*factor_range)
        enhancer = ImageEnhance.Contrast(image)
        return enhancer.enhance(factor)
    
    @staticmethod
    def apply_augmentations(
        image: Image.Image,
        flip: bool = True,
        rotate: bool = True,
        brightness: bool = True,
        contrast: bool = True
    ) -> Image.Image:
        """
        Apply multiple augmentations to an image.
        
        Args:
            image: PIL Image to augment
            flip: Whether to apply random horizontal flip
            rotate: Whether to apply random rotation
            brightness: Whether to apply random brightness adjustment
            contrast: Whether to apply random contrast adjustment
            
        Returns:
            Augmented PIL Image
        """
        if flip:
            image = ImageAugmentor.random_flip(image)
        if rotate:
            image = ImageAugmentor.random_rotation(image)
        if brightness:
            image = ImageAugmentor.random_brightness(image)
        if contrast:
            image = ImageAugmentor.random_contrast(image)
        
        return image


def create_soil_preprocessor() -> ImagePreprocessor:
    """
    Create preprocessor configured for soil classification model.
    
    Returns:
        ImagePreprocessor instance with soil classification settings
    """
    return ImagePreprocessor(
        target_size=(224, 224),
        normalize=True
    )


def create_grievance_preprocessor() -> ImagePreprocessor:
    """
    Create preprocessor configured for grievance categorization model.
    
    Returns:
        ImagePreprocessor instance with grievance categorization settings
    """
    return ImagePreprocessor(
        target_size=(224, 224),
        normalize=True
    )


# Example usage
if __name__ == "__main__":
    # Create preprocessor
    preprocessor = ImagePreprocessor()
    
    # Preprocess single image
    image_array = preprocessor.preprocess("path/to/image.jpg")
    if image_array is not None:
        print(f"Preprocessed image shape: {image_array.shape}")
        print(f"Value range: [{image_array.min():.2f}, {image_array.max():.2f}]")
    
    # Preprocess batch
    image_paths = ["image1.jpg", "image2.jpg", "image3.jpg"]
    batch_array, valid_indices = preprocessor.preprocess_batch(image_paths)
    print(f"Batch shape: {batch_array.shape}")
    print(f"Valid images: {len(valid_indices)}/{len(image_paths)}")
