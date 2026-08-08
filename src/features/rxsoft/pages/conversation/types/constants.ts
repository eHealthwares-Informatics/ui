export const QUESTION_TYPE_OPTIONS = [
  'text',
  'number',
  'date',
  'email',
  'single_choice',
  'multi_choice',
  'boolean',
  'file',
  'ai_open',
].map((value) => ({ value, label: value }));

export const RENDER_MODE_OPTIONS = [
  'input',
  'textarea',
  'radio',
  'checkbox',
  'yes_no',
  'star_rating',
  'TEXT_WITH_LINK',
  'LINK',
  'dropdown',
  'chat',
  'file_upload',
].map((value) => ({ value, label: value }));

export const PROCESS_MODE_OPTIONS = [
  'none',
  'option_processed',
  'api_processed',
  'ai_processed',
  'question_type',
  'rule_engine',
].map((value) => ({ value, label: value }));

export const PROCESSING_STRATEGY_OPTIONS = ['STATIC', 'AI_ASSISTED', 'FULL_AI'].map((value) => ({
  value,
  label: value,
}));

export const WORKFLOW_STEP_TYPE_OPTIONS = ['QUESTIONNAIRE', 'ACTION', 'WAIT', 'END'].map(
  (value) => ({ value, label: value })
);

export const WORKFLOW_STATUS_OPTIONS = ['ACTIVE', 'COMPLETED', 'STOPPED'].map((value) => ({
  value,
  label: value,
}));

export const CHANNEL_TYPE_OPTIONS = [
  'WEB',
  'WHATSAPP',
  'SMS',
  'EMAIL',
  'WEBCHAT',
  'TELEGRAM',
  'API',
].map((value) => ({ value, label: value }));

export const EXCHANGE_DIRECTION_OPTIONS = ['INBOUND', 'OUTBOUND', 'PAGE_REQUEST'].map((value) => ({
  value,
  label: value,
}));

export const EXCHANGE_STATUS_OPTIONS = ['RECEIVED', 'SENT', 'FAILED'].map((value) => ({
  value,
  label: value,
}));

export const CONVERSATION_STATUS_OPTIONS = ['ACTIVE', 'COMPLETED', 'STOPPED', 'CANCELLED'].map(
  (value) => ({ value, label: value })
);

export const CONVERSATION_STATE_OPTIONS = [
  'START',
  'PROCESSING',
  'WAITING_FOR_DELIVERY',
  'WAITING_FOR_USER',
  'COMPLETED',
].map((value) => ({ value, label: value }));

export const VALIDATION_RULE_OPTIONS = [
  'question-type',
  'required',
  'min',
  'max',
  'regex',
  'api',
].map((value) => ({ value, label: value }));
