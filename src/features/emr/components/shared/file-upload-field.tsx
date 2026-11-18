import {
  ActionIcon,
  Alert,
  Anchor,
  Button,
  FileButton,
  Group,
  Loader,
  Stack,
  Text,
} from '@mantine/core';
import { AlertCircle, Paperclip, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { emrPublicApi } from '@/lib/emr-public-api';

export type UploadedFile = {
  url: string;
  cloudinaryUrl?: string | null;
  s3Url?: string | null;
  key?: string;
  name: string;
  mimeType?: string;
  size?: number;
};

function normalize(value: unknown, multiple: boolean): UploadedFile[] {
  if (multiple) {
    return Array.isArray(value)
      ? (value.filter(
          (entry) => entry && typeof entry === 'object' && typeof entry.url === 'string'
        ) as UploadedFile[])
      : [];
  }
  return value && typeof value === 'object' && typeof (value as UploadedFile).url === 'string'
    ? [value as UploadedFile]
    : [];
}

/**
 * Immediate file upload control. Files are uploaded as soon as they are
 * selected; the field stores the returned S3/Cloudinary URLs.
 */
export function FileUploadField({
  value,
  onChange,
  label,
  required = false,
  error,
  disabled = false,
  publicToken,
  accept,
  multiple = false,
  maxSizeMb = 10,
}: {
  value: unknown;
  onChange: (value: UploadedFile | UploadedFile[] | undefined) => void;
  label?: string;
  required?: boolean;
  error?: React.ReactNode;
  disabled?: boolean;
  publicToken?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const files = normalize(value, multiple);

  const upload = async (selected: File | File[] | null) => {
    if (!selected) {
      return;
    }
    const list = Array.isArray(selected) ? selected : [selected];
    const maxBytes = maxSizeMb * 1024 * 1024;
    const tooLarge = list.find((file) => file.size > maxBytes);
    if (tooLarge) {
      setUploadError(`${tooLarge.name} exceeds the ${maxSizeMb} MB limit`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const uploaded: UploadedFile[] = [];
      for (const file of list) {
        const body = new FormData();
        body.append('file', file);
        const endpoint = publicToken ? `/public/forms/${publicToken}/uploads` : '/uploads';
        const { data } = await (publicToken ? emrPublicApi : emrApi).post<UploadedFile>(
          endpoint,
          body
        );
        uploaded.push(data);
      }
      const next = multiple ? [...files, ...uploaded] : uploaded.slice(-1);
      onChange(multiple ? next : next[0]);
    } catch (err) {
      setUploadError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Upload failed — please try again'
      );
    } finally {
      setUploading(false);
    }
  };

  const remove = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    onChange(multiple ? next : undefined);
  };

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <Group gap="xs">
        <FileButton
          onChange={upload}
          accept={accept}
          multiple={multiple}
          disabled={disabled || uploading}
        >
          {(props) => (
            <Button
              {...props}
              variant="light"
              leftSection={<Paperclip size={14} />}
              loading={uploading}
              data-testid="file-upload-button"
            >
              {files.length ? 'Add file' : 'Choose file'}
            </Button>
          )}
        </FileButton>
        {uploading && <Loader size="sm" />}
      </Group>

      {files.map((file, index) => (
        <Group key={`${file.url}-${index}`} gap="xs" wrap="nowrap">
          <Anchor href={file.url} target="_blank" rel="noopener noreferrer" size="sm">
            {file.name}
          </Anchor>
          {file.size != null && (
            <Text size="xs" c="dimmed">
              {(file.size / 1024).toFixed(0)} KB
            </Text>
          )}
          <ActionIcon
            size="sm"
            variant="subtle"
            color="red"
            disabled={disabled || uploading}
            onClick={() => remove(index)}
            aria-label="Remove file"
            data-testid="file-remove-button"
          >
            <Trash2 size={13} />
          </ActionIcon>
        </Group>
      ))}

      {(uploadError || error) && (
        <Alert color="red" icon={<AlertCircle size={16} />}>
          {uploadError ?? error}
        </Alert>
      )}
    </Stack>
  );
}
