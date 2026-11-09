import { Image } from '@mantine/core';

type ImageCellProps = {
  src?: string;
  w?: number;
  h?: number;
  fallback?: string;
};

export function ImageCell({ src, w = 40, h = 40, fallback }: ImageCellProps) {
  if (!src) {
    return null;
  }

  return (
    <Image
      src={src}
      w={w}
      h={h}
      fit="cover"
      radius="sm"
      fallbackSrc={fallback ?? 'https://placehold.co/40x40?text=No+Image'}
    />
  );
}
