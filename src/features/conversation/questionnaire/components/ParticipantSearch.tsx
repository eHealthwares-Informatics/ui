import { Button, Input } from '@mantine/core';

type Props = {
  phone: string;
  setPhone: (v: string) => void;
  participants: any[];
  loading: boolean;
  onSelect: (id: string) => void;
  selectedId: string;
};

export function ParticipantSearch(props: Props) {
  const { phone, setPhone, participants, loading, onSelect, selectedId } = props;

  return (
    <>
      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone" />

      {loading ? (
        <p>Loading...</p>
      ) : (
        participants.map((p) => (
          <Button key={p.id} onClick={() => onSelect(p.id)}>
            {p.phone}
            {selectedId === p.id && ' ✓'}
          </Button>
        ))
      )}
    </>
  );
}
