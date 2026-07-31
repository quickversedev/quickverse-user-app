import React from 'react';
import FastImage, { FastImageProps } from '@d11/react-native-fast-image';

type CachedImageProps = Omit<FastImageProps, 'source'> & {
  uri: string | undefined | null;
};

const CachedImage: React.FC<CachedImageProps> = ({ uri, style, ...rest }) => {
  if (!uri) return null;

  return (
    <FastImage
      source={{ uri, priority: FastImage.priority.normal, cache: FastImage.cacheControl.immutable }}
      style={style}
      resizeMode={rest.resizeMode ?? FastImage.resizeMode.cover}
      {...rest}
    />
  );
};

export default React.memo(CachedImage);
