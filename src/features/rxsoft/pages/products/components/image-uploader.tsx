import { useState, useRef } from 'react';
import { Box, Button, Group, Image, Paper, Text, Stack, ActionIcon, Loader } from '@mantine/core';
import { Upload, X, Camera } from 'lucide-react';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { green, ink, muted, line } from '@/features/shop/website/layout';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  description?: string;
  size?: 'small' | 'medium' | 'large';
}

const sizeMap: Record<string, number> = {
  small: 120,
  medium: 200,
  large: 300,
};

export function ImageUploader({
  value,
  onChange,
  label,
  description,
  size = 'medium',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewSize = sizeMap[size];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {return;}

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await rxsoftApi.post('/upload/image', formData);
      onChange(res.data.url ?? res.data.imageUrl ?? res.data);
    } catch {
      // upload failed
    } finally {
      setUploading(false);
      if (inputRef.current) {inputRef.current.value = '';}
    }
  };

  const handleRemove = () => {
    onChange('');
    if (inputRef.current) {inputRef.current.value = '';}
  };

  return (
    <Paper
      p="md"
      style={{
        border: `1px solid ${line}`,
        borderRadius: 12,
        background: '#fff',
      }}
    >
      <Stack gap="sm">
        <Group gap={6}>
          <Camera size={16} color={ink} />
          <Text size="sm" fw={600} c={ink}>
            {label}
          </Text>
        </Group>

        {description && (
          <Text size="xs" c={muted}>
            {description}
          </Text>
        )}

        <Box
        style={{
          width: previewSize,
          height: previewSize,
          borderRadius: 8,
          overflow: 'hidden',
          border: value ? 'none' : `2px dashed ${line}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: value ? 'transparent' : '#FAFAFA',
          position: 'relative',
        }}
      >
        {uploading ? (
          <Loader size={28} color={green} />
        ) : value ? (
          <Image
            src={value}
            alt={label}
            w={previewSize}
            h={previewSize}
            fit="cover"
            fallbackSrc="https://placehold.co/200x200?text=No+Image"
          />
        ) : (
          <Upload size={28} color={muted} />
        )}
      </Box>

        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            color="green"
            leftSection={uploading ? <Loader size={14} /> : <Upload size={14} />}
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>

          {value && (
            <ActionIcon variant="subtle" color="red" size="sm" onClick={handleRemove}>
              <X size={14} />
            </ActionIcon>
          )}
        </Group>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </Stack>
    </Paper>
  );
}
