import { Stack, SimpleGrid } from '@mantine/core';
import { ImageUploader } from './image-uploader';

interface ProductImagesTabProps {
  values: Record<string, string>;
  onChange: (field: string, url: string) => void;
}

const imageFields = [
  {
    field: 'imageUrl',
    label: 'Default Image',
    desc: 'Main product thumbnail',
    size: 'medium' as const,
  },
  {
    field: 'smallImageUrl',
    label: 'Small Image',
    desc: 'Used for list views',
    size: 'small' as const,
  },
  {
    field: 'mediumImageUrl',
    label: 'Medium Image',
    desc: 'Used for card layouts',
    size: 'medium' as const,
  },
  {
    field: 'largeImageUrl',
    label: 'Large Image',
    desc: 'Full-size detail image',
    size: 'large' as const,
  },
];

export function ProductImagesTab({ values, onChange }: ProductImagesTabProps) {
  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {imageFields.map(({ field, label, desc, size }) => (
          <ImageUploader
            key={field}
            label={label}
            description={desc}
            value={values[field]}
            onChange={(url) => onChange(field, url)}
            size={size}
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
}
