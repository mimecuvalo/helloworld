import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

export const ImageWithFallback = (props: ImageProps) => {
  const [isError, setIsError] = useState(false);

  if (isError) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} src={props.src as string} alt={props.alt} />;
  }

  return (
    <Image
      {...props}
      alt={props.alt}
      onError={() => {
        setIsError(true);
      }}
    />
  );
};

export default ImageWithFallback;
