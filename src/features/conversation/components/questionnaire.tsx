import {
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  Modal,
  Radio,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
  Progress,
  Paper,
} from '@mantine/core';
import { DatePickerInput, DateTimePicker } from '@mantine/dates';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  MonitorSmartphone,
  Star,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export type QuestionnaireOption = {
  id?: string;
  key?: string;
  label: string;
  value?: string;
  index?: number;
};

export type QuestionnaireQuestion = {
  id?: string;
  attribute?: string;
  text: string;
  description?: string;
  questionType?: string;
  renderMode?: string;
  processMode?: string;
  index?: number;
  isRequired?: boolean;
  options?: QuestionnaireOption[];
};

type AnswerValue = string | string[] | number | boolean | null;

export type QuestionnaireProps = {
  title?: string;
  description?: string;
  showTitle?: boolean;
  showDescription?: boolean;
  questions?: QuestionnaireQuestion[];
  initialAnswers?: Record<string, AnswerValue>;
  initialCurrentQuestionId?: string;
  initialMode?: 'horizontal' | 'vertical';
  onSaveProgress?: (payload: {
    currentQuestion: QuestionnaireQuestion;
    answers: Record<string, AnswerValue>;
    progress: number;
    currentIndex: number;
  }) => Promise<void> | void;
  onComplete?: (payload: {
    answers: Record<string, AnswerValue>;
    questions: QuestionnaireQuestion[];
  }) => Promise<void> | void;
  onProcessAnswer?: (payload: {
    question: QuestionnaireQuestion;
    answer: AnswerValue;
    answers: Record<string, AnswerValue>;
    currentIndex: number;
    questions: QuestionnaireQuestion[];
  }) =>
    | Promise<{
        advance?: boolean;
        nextQuestionId?: string;
        complete?: boolean;
        errorMessage?: string;
        answers?: Record<string, AnswerValue>;
      } | void>
    | {
        advance?: boolean;
        nextQuestionId?: string;
        complete?: boolean;
        errorMessage?: string;
        answers?: Record<string, AnswerValue>;
      }
    | void;
};

const MODE_STORAGE_KEY = 'rxsoft-questionnaire-mode';

export const SAMPLE_QUESTIONS: QuestionnaireQuestion[] = [
  {
    id: 'ux-1',
    attribute: 'overall_experience',
    text: 'How would you rate your overall experience with the product?',
    description: 'Choose a rating from 1 to 5 stars.',
    questionType: 'number',
    renderMode: 'star_rating',
    processMode: 'question_type',
    index: 1,
    isRequired: true,
  },
];

function getQuestionKey(question: QuestionnaireQuestion, index: number) {
  return question.attribute || question.id || `question-${index}`;
}

function getOptionValue(option: QuestionnaireOption, index: number) {
  return option.key || option.label || option.value || String(index + 1);
}

function normalizeQuestions(questions: QuestionnaireQuestion[]) {
  return [...questions]
    .map((question, index) => ({
      ...question,
      index: Number(question.index ?? index + 1),
      options: [...(question.options ?? [])].sort(
        (left, right) => Number(left.index ?? 0) - Number(right.index ?? 0)
      ),
    }))
    .sort((left, right) => Number(left.index ?? 0) - Number(right.index ?? 0));
}

function isQuestionAnswered(value: AnswerValue) {
  if (Array.isArray(value)) {return value.length > 0;}
  if (typeof value === 'boolean') {return true;}
  if (typeof value === 'number') {return value > 0;}

  return String(value ?? '').trim().length > 0;
}

function formatAnswer(value: AnswerValue) {
  if (Array.isArray(value)) {return value.join(', ');}
  if (typeof value === 'boolean') {return value ? 'Yes' : 'No';}

  return value == null || value === '' ? 'Not answered' : String(value);
}

function getInputKind(question: QuestionnaireQuestion) {
  if (question.renderMode === 'yes_no') {return 'yes_no';}
  if (question.renderMode === 'star_rating') {return 'star_rating';}
  if (question.questionType === 'boolean') {return 'yes_no';}
  if (question.questionType === 'multi_choice') {return 'checkbox';}
  if (question.questionType === 'single_choice') {return 'radio';}
  if (question.questionType === 'date') {return 'date';}
  if (question.questionType === 'datetime') {return 'datetime';}
  if (question.renderMode === 'textarea') {return 'textarea';}

  return 'input';
}

export function Questionnaire({
  title = 'User Experience Feedback',
  description = 'Answer each question in order.',
  showTitle = true,
  showDescription = true,
  questions = SAMPLE_QUESTIONS,
  initialAnswers,
  initialCurrentQuestionId,
  initialMode = 'horizontal',
  onSaveProgress,
  onComplete,
  onProcessAnswer,
}: QuestionnaireProps) {
  const normalizedQuestions = useMemo(
    () => normalizeQuestions(questions.length > 0 ? questions : SAMPLE_QUESTIONS),
    [questions]
  );

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initialAnswers ?? {});

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!initialCurrentQuestionId) {return 0;}

    const index = normalizedQuestions.findIndex(
      (question) => question.id === initialCurrentQuestionId
    );

    return index >= 0 ? index : 0;
  });

  const [mode, setMode] = useState<'horizontal' | 'vertical'>(() => {
    if (typeof window === 'undefined') {return initialMode;}

    const stored = window.localStorage.getItem(MODE_STORAGE_KEY);

    return stored === 'vertical' || stored === 'horizontal' ? stored : initialMode;
  });

  const [isComplete, setIsComplete] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentQuestion = normalizedQuestions[currentIndex];

  const progress = normalizedQuestions.length
    ? Math.round(
        (Math.min(currentIndex + (isComplete ? 1 : 0), normalizedQuestions.length) /
          normalizedQuestions.length) *
          100
      )
    : 0;

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'vertical' || !currentQuestion) {return;}

    const key = getQuestionKey(currentQuestion, currentIndex);

    questionRefs.current[key]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [currentIndex, currentQuestion, mode]);

  async function saveProgress(nextIndex: number, nextAnswers: Record<string, AnswerValue>) {
    if (!onSaveProgress || !currentQuestion) {return;}

    await onSaveProgress({
      currentQuestion,
      answers: nextAnswers,
      progress: normalizedQuestions.length
        ? Math.round(((nextIndex + 1) / normalizedQuestions.length) * 100)
        : 0,
      currentIndex: nextIndex,
    });
  }

  async function goNext() {
    if (!currentQuestion) {return;}

    const key = getQuestionKey(currentQuestion, currentIndex);

    const value = answers[key];

    if (currentQuestion.isRequired && !isQuestionAnswered(value)) {
      setError('This question is required before you continue.');

      return;
    }

    setError('');
    setIsSubmitting(true);

    let nextAnswers = answers;

    try {
      if (onProcessAnswer) {
        const result = await onProcessAnswer({
          question: currentQuestion,
          answer: value,
          answers,
          currentIndex,
          questions: normalizedQuestions,
        });

        if (result?.answers) {
          nextAnswers = result.answers;
          setAnswers(result.answers);
        }

        if (result?.errorMessage) {
          setError(result.errorMessage);
          return;
        }

        if (result?.complete) {
          setIsComplete(true);
          setShowCompletionDialog(true);

          await onComplete?.({
            answers: nextAnswers,
            questions: normalizedQuestions,
          });

          return;
        }
      }

      if (currentIndex >= normalizedQuestions.length - 1) {
        setIsComplete(true);
        setShowCompletionDialog(true);

        await onComplete?.({
          answers: nextAnswers,
          questions: normalizedQuestions,
        });

        return;
      }

      const nextIndex = currentIndex + 1;

      setCurrentIndex(nextIndex);

      await saveProgress(nextIndex, nextAnswers);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function goPrevious() {
    if (currentIndex === 0) {return;}

    const nextIndex = currentIndex - 1;

    setCurrentIndex(nextIndex);
    setError('');

    await saveProgress(nextIndex, answers);
  }

  function updateAnswer(question: QuestionnaireQuestion, index: number, value: AnswerValue) {
    const key = getQuestionKey(question, index);

    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));

    setError('');
  }

  if (isComplete) {
    return (
      <Stack maw={900} mx="auto" gap="lg">
        <Card withBorder radius="xl" p="xl">
          <Stack gap="md">
            <Badge variant="light" w="fit-content">
              Questionnaire Complete
            </Badge>

            <Title order={2}>{title}</Title>

            <Text c="dimmed">Thanks for completing the questionnaire.</Text>

            {normalizedQuestions.map((question, index) => {
              const key = getQuestionKey(question, index);

              return (
                <Paper key={key} withBorder radius="lg" p="md">
                  <Stack gap={4}>
                    <Text size="sm" c="dimmed">
                      Question {index + 1}
                    </Text>

                    <Text fw={600}>{question.text}</Text>

                    <Text size="sm">{formatAnswer(answers[key])}</Text>
                  </Stack>
                </Paper>
              );
            })}

            <Button variant="light" onClick={() => setIsComplete(false)}>
              Review Answers
            </Button>
          </Stack>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack maw={1200} mx="auto" gap="lg">
      <Card withBorder radius="xl" p="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Badge variant="light" w="fit-content">
              {progress}% complete
            </Badge>

            {showTitle && <Title order={2}>{title}</Title>}

            {showDescription && <Text c="dimmed">{description}</Text>}
          </Stack>

          <Tabs value={mode} onChange={(value) => setMode(value as 'horizontal' | 'vertical')}>
            <Tabs.List grow>
              <Tabs.Tab value="horizontal" leftSection={<MonitorSmartphone size={16} />}>
                Horizontal
              </Tabs.Tab>

              <Tabs.Tab value="vertical" leftSection={<ListChecks size={16} />}>
                Vertical
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </Group>

        <Progress value={progress} mt="lg" radius="xl" />

        <Group mt="lg" gap="sm" wrap="nowrap">
          <ScrollArea w="100%">
            <Group gap="sm" wrap="nowrap">
              {normalizedQuestions.map((question, index) => {
                const key = getQuestionKey(question, index);

                const answered = isQuestionAnswered(answers[key]);

                const isCurrent = currentIndex === index;

                return (
                  <Button
                    key={key}
                    variant={isCurrent ? 'filled' : answered ? 'light' : 'default'}
                    disabled={index > currentIndex}
                    onClick={() => {
                      if (index <= currentIndex) {
                        setCurrentIndex(index);
                        setError('');
                      }
                    }}
                    leftSection={answered && !isCurrent ? <Check size={14} /> : undefined}
                  >
                    {question.attribute || `Step ${index + 1}`}
                  </Button>
                );
              })}
            </Group>
          </ScrollArea>
        </Group>
      </Card>

      {mode === 'horizontal' ? (
        <HorizontalQuestionView
          key={getQuestionKey(currentQuestion, currentIndex)}
          question={currentQuestion}
          questionIndex={currentIndex}
          total={normalizedQuestions.length}
          value={answers[getQuestionKey(currentQuestion, currentIndex)]}
          error={error}
          onChange={(value) => updateAnswer(currentQuestion, currentIndex, value)}
          onPrevious={goPrevious}
          onNext={goNext}
          isSubmitting={isSubmitting}
        />
      ) : (
        <VerticalQuestionView
          questions={normalizedQuestions}
          currentIndex={currentIndex}
          answers={answers}
          error={error}
          onAnswerChange={updateAnswer}
          onPrevious={goPrevious}
          onNext={goNext}
          isSubmitting={isSubmitting}
          registerRef={(key, node) => {
            questionRefs.current[key] = node;
          }}
        />
      )}

      <Modal
        opened={showCompletionDialog}
        onClose={() => setShowCompletionDialog(false)}
        title="Questionnaire Complete"
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            The questionnaire has been completed successfully.
          </Text>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setShowCompletionDialog(false)}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

function HorizontalQuestionView({
  question,
  questionIndex,
  total,
  value,
  error,
  onChange,
  onPrevious,
  onNext,
  isSubmitting,
}: {
  question: QuestionnaireQuestion;
  questionIndex: number;
  total: number;
  value: AnswerValue;
  error: string;
  onChange: (value: AnswerValue) => void;
  onPrevious: () => void;
  onNext: () => void;
  isSubmitting: boolean;
}) {
  return (
    <Card withBorder radius="xl" maw={900} mx="auto" w="100%" p="xl">
      <Stack gap="lg">
        <Stack gap={4}>
          <Badge variant="outline" w="fit-content">
            Question {questionIndex + 1} of {total}
          </Badge>

          <Title order={3}>{question.text}</Title>

          {question.description && <Text c="dimmed">{question.description}</Text>}
        </Stack>

        <QuestionInput question={question} value={value} onChange={onChange} enabled />

        {error ? (
          <Text c="red" size="sm">
            {error}
          </Text>
        ) : null}

        <Group justify="space-between">
          <Button
            variant="default"
            onClick={onPrevious}
            disabled={questionIndex === 0}
            leftSection={<ChevronLeft size={16} />}
          >
            Previous
          </Button>

          <Button
            onClick={onNext}
            loading={isSubmitting}
            rightSection={questionIndex !== total - 1 ? <ChevronRight size={16} /> : undefined}
          >
            {questionIndex === total - 1 ? 'Finish' : 'Next'}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}

function VerticalQuestionView({
  questions,
  currentIndex,
  answers,
  error,
  onAnswerChange,
  onPrevious,
  onNext,
  isSubmitting,
  registerRef,
}: {
  questions: QuestionnaireQuestion[];
  currentIndex: number;
  answers: Record<string, AnswerValue>;
  error: string;
  onAnswerChange: (question: QuestionnaireQuestion, index: number, value: AnswerValue) => void;
  onPrevious: () => void;
  onNext: () => void;
  isSubmitting: boolean;
  registerRef: (key: string, node: HTMLDivElement | null) => void;
}) {
  return (
    <Card withBorder radius="xl" p={0}>
      <Stack gap={0}>
        <Stack p="lg" gap={4}>
          <Title order={4}>Sequential Form View</Title>

          <Text size="sm" c="dimmed">
            Future questions unlock progressively.
          </Text>
        </Stack>

        <ScrollArea h={700}>
          <Stack p="lg">
            {questions.map((question, index) => {
              const key = getQuestionKey(question, index);

              const status =
                index < currentIndex ? 'previous' : index === currentIndex ? 'current' : 'future';

              return (
                <Paper
                  key={key}
                  ref={(node) => registerRef(key, node)}
                  withBorder
                  radius="xl"
                  p="lg"
                  style={{
                    opacity: status === 'future' ? 0.6 : 1,
                  }}
                >
                  <Stack gap="lg">
                    <Group justify="space-between">
                      <Stack gap={4}>
                        <Text size="sm" c="dimmed">
                          Question {index + 1}
                        </Text>

                        <Text fw={600} size="lg">
                          {question.text}
                        </Text>

                        {question.description && (
                          <Text size="sm" c="dimmed">
                            {question.description}
                          </Text>
                        )}
                      </Stack>

                      <Badge variant={status === 'current' ? 'filled' : 'light'}>{status}</Badge>
                    </Group>

                    <QuestionInput
                      question={question}
                      value={answers[key]}
                      onChange={(value) => onAnswerChange(question, index, value)}
                      enabled={status === 'current'}
                    />

                    {status === 'current' && (
                      <Group justify="space-between">
                        <Button
                          variant="default"
                          onClick={onPrevious}
                          disabled={currentIndex === 0}
                          leftSection={<ChevronLeft size={16} />}
                        >
                          Previous
                        </Button>

                        <Button
                          onClick={onNext}
                          loading={isSubmitting}
                          rightSection={
                            currentIndex !== questions.length - 1 ? (
                              <ChevronRight size={16} />
                            ) : undefined
                          }
                        >
                          {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
                        </Button>
                      </Group>
                    )}

                    {status === 'current' && error && (
                      <Text c="red" size="sm">
                        {error}
                      </Text>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </ScrollArea>
      </Stack>
    </Card>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
  enabled,
}: {
  question: QuestionnaireQuestion;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  enabled: boolean;
}) {
  const inputKind = getInputKind(question);

  if (inputKind === 'radio') {
    return (
      <Radio.Group value={typeof value === 'string' ? value : ''} onChange={onChange}>
        <Stack gap="sm">
          {(question.options ?? []).map((option, index) => {
            const optionValue = getOptionValue(option, index);

            return (
              <Radio.Card
                key={optionValue}
                value={optionValue}
                disabled={!enabled}
                radius="xl"
                p="md"
              >
                <Text fw={500}>{option.label}</Text>
              </Radio.Card>
            );
          })}
        </Stack>
      </Radio.Group>
    );
  }

  if (inputKind === 'checkbox') {
    const selected = Array.isArray(value) ? value : [];

    return (
      <Stack gap="sm">
        {(question.options ?? []).map((option, index) => {
          const optionValue = getOptionValue(option, index);

          return (
            <Checkbox
              key={optionValue}
              checked={selected.includes(optionValue)}
              disabled={!enabled}
              label={option.label}
              onChange={(event) => {
                if (!enabled) {return;}

                if (event.currentTarget.checked) {
                  onChange([...selected, optionValue]);

                  return;
                }

                onChange(selected.filter((item) => item !== optionValue));
              }}
            />
          );
        })}
      </Stack>
    );
  }

  if (inputKind === 'textarea') {
    return (
      <Textarea
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.currentTarget.value)}
        disabled={!enabled}
        minRows={5}
        placeholder="Type your answer here..."
      />
    );
  }

  if (inputKind === 'date') {
    return (
      <DatePickerInput
        value={typeof value === 'string' && value ? value : null}
        onChange={(next) => onChange(next ?? '')}
        disabled={!enabled}
        clearable
        valueFormat="YYYY-MM-DD"
        placeholder="Pick a date"
      />
    );
  }

  if (inputKind === 'datetime') {
    return (
      <DateTimePicker
        value={typeof value === 'string' && value ? value : null}
        onChange={(next) => onChange(next ?? '')}
        disabled={!enabled}
        clearable
        valueFormat="YYYY-MM-DD HH:mm:ss"
        placeholder="Pick a date and time"
      />
    );
  }

  if (inputKind === 'yes_no') {
    return (
      <Group grow>
        {[
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ].map((option) => (
          <Button
            key={String(option.value)}
            variant={value === option.value ? 'filled' : 'default'}
            disabled={!enabled}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </Group>
    );
  }

  if (inputKind === 'star_rating') {
    const currentValue = typeof value === 'number' ? value : 0;

    return (
      <Group gap="xs">
        {Array.from({ length: 5 }, (_, index) => {
          const rating = index + 1;

          return (
            <Button
              key={rating}
              variant={currentValue >= rating ? 'filled' : 'default'}
              disabled={!enabled}
              onClick={() => onChange(rating)}
            >
              <Star size={18} />
            </Button>
          );
        })}
      </Group>
    );
  }

  return (
    <TextInput
      value={typeof value === 'string' ? value : ''}
      onChange={(event) => onChange(event.currentTarget.value)}
      disabled={!enabled}
      placeholder="Type your answer here..."
    />
  );
}
