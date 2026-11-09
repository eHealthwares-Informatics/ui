import { Tabs } from '@mantine/core';
import { useState } from 'react';
import { RxPage } from '@/components/page/rx-page';
import { Concepts } from './components/concepts';
import { Mapping } from './components/mappings';
import { Values } from './components/values';

export function CodingConceptRegistryPage() {
  const [formState, setFormState] = useState<any>({});
  const updateField = (name: string, value: unknown) => {
    setFormState((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <RxPage
      title="Coding Concept Registry"
      description="Manage concept codes, concept metadata values, and external mappings for the terminology service."
    >
      <Concepts />
    </RxPage>
  );
}
