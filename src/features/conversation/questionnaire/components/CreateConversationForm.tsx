import { Button, Input } from '@mantine/core';
import { Loader2, PlayCircle } from 'lucide-react';
import { AsyncSelectField } from '@/components/form/async-field';
import { SelectField } from '@/components/form/select';
import { Option } from '@/features/rxsoft/types';
import type { DisplayMode } from '@/routes/questionnaire/-types';

type Props = {
  phone: string;
  setPhone: (value: string) => void;

  questionnaire?: Option;
  setQuestionnaire?: (option: Option | null) => void;

  channel?: Option;
  setChannel?: (option: Option | null) => void;

  displayMode?: Option;
  setDisplayMode?: (option: Option | null) => void;

  onSubmit: (payload: {
    phone: string;
    questionnaireId?: string;
    channelId?: string;
    displayMode?: DisplayMode;
  }) => void;

  loading?: boolean;

  disabled?: {
    phone?: boolean;
    questionnaire?: boolean;
    channel?: boolean;
    displayMode?: boolean;
  };
};

export function CreateConversationForm({
  phone,
  setPhone,

  questionnaire,
  setQuestionnaire = (option: Option | null) => {},

  channel,
  setChannel = (option: Option | null) => {},

  displayMode = { value: 'EACH', label: 'EACH' },
  setDisplayMode = (option: Option | null) => {},

  onSubmit,
  loading,

  disabled,
}: Props) {
  const isDisabled = !phone.trim() || !channel || !questionnaire;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* QUESTIONNAIRE */}
      <AsyncSelectField
        value={questionnaire || null}
        field={{
          name: 'questionnaireId',
          label: 'Questionnaire',
          type: 'async-select',
          searchParam: {
            endpoint: '/questionnaires',
            queryParam: 'search',
            minChars: 2,
            valueKey: 'id',
            labelKey: 'name',
          },
          placeholder: 'Search questionnaire',
        }}
        disabled={disabled?.questionnaire}
        onChange={setQuestionnaire}
      />

      {/* CHANNEL */}
      <AsyncSelectField
        value={channel || null}
        field={{
          name: 'channelId',
          label: 'Channel',
          type: 'async-select',
          searchParam: {
            endpoint: '/channels',
            queryParam: 'search',
            minChars: 0,
            valueKey: 'id',
            labelKey: 'name',
          },
          placeholder: 'Search channel',
        }}
        disabled={disabled?.channel}
        onChange={setChannel}
      />

      {/* PHONE */}
      <Input
        value={phone}
        disabled={disabled?.phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Participant phone"
      />

      {/* DISPLAY MODE */}
      <SelectField
        value={displayMode || null}
        disabled={disabled?.displayMode}
        onChange={(v) => setDisplayMode(v)}
        options={[
          { value: 'ALL', label: 'ALL' },
          { value: 'EACH', label: 'EACH' },
        ]}
        placeholder="Display mode"
      />

      {/* SUBMIT */}
      <div className="md:col-span-2">
        <Button
          type="button"
          disabled={isDisabled || loading}
          onClick={() =>
            onSubmit({
              phone: phone.trim(),
              questionnaireId: questionnaire?.value,
              channelId: channel?.value,
              displayMode: displayMode?.value as DisplayMode,
            })
          }
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <PlayCircle className="size-4" />
          )}
          Start Conversation
        </Button>
      </div>
    </div>
  );
}
