import type { Option } from '@/features/rxsoft/types';

export const AI_PROVIDER_OPTIONS: Option[] = [
  'openai',
  'anthropic',
  'gemini',
  'deepseek',
  'grok',
  'openrouter',
].map((value) => ({ value, label: value }));

export const AI_ROUTING_OPTIONS: Option[] = [
  { value: 'direct', label: 'direct' },
  { value: 'openrouter', label: 'openrouter' },
];

export const AI_TIER_OPTIONS: Option[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((value) => ({
  value,
  label: value,
}));
