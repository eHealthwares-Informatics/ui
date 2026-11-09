import { Button, Input } from '@mantine/core';

type Props = {
  value: string;
  setValue: (v: string) => void;
  onLoad: () => void;
  loading: boolean;
};

export function ConversationLoader({ value, setValue, onLoad, loading }: Props) {
  return (
    <div className="flex gap-2">
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button onClick={onLoad} disabled={loading}>
        Load
      </Button>
    </div>
  );
}
