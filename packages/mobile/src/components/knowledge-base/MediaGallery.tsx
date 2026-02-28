/**
 * Media Gallery Component
 * Display article media (images, videos, audio) in a gallery format
 * TODO: Implement full functionality as per UI spec
 */

import React, { useState } from 'react';
import { View, Image, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface MediaGalleryProps {
  media: {
    images?: Array<{ url: string; thumbnail_url?: string }>;
    videos?: Array<{ url: string; thumbnail_url?: string }>;
    audio?: Array<{ url: string }>;
  };
}

export default function MediaGallery({ media }: MediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = media.images || [];

  if (images.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: images[activeIndex].url }}
        style={styles.mainImage}
        resizeMode="cover"
      />
      {images.length > 1 && (
        <FlatList
          horizontal
          data={images}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity onPress={() => setActiveIndex(index)}>
              <Image
                source={{ uri: item.thumbnail_url || item.url }}
                style={[
                  styles.thumbnail,
                  activeIndex === index && styles.thumbnailActive,
                ]}
              />
            </TouchableOpacity>
          )}
          style={styles.thumbnailList}
          showsHorizontalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  mainImage: {
    width: width - 32,
    height: 240,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  thumbnailList: {
    marginTop: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#007AFF',
  },
});
