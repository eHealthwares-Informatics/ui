import {
  AudioWaveform,
  Boxes,
  Command,
  Globe,
  HeartPulse,
  MessageSquare,
  Microscope,
  Shield,
} from 'lucide-react';

/**
 * Single source of module presentation metadata — shared by the TeamSwitcher
 * dropdown and the post-login module landing grid. `Shield` is the fallback
 * icon for modules without a dedicated one (identity, website).
 */
export const moduleIcons: Record<string, React.ElementType> = {
  rxsoft: Command,
  communication: AudioWaveform,
  conversation: MessageSquare,
  'coding-concept': Boxes,
  lis: Microscope,
  emr: HeartPulse,
  admin: Shield,
  website: Globe,
  identity: Shield,
};

export const modulePlans: Record<string, string> = {
  rxsoft: 'Pharmacy Admin',
  communication: 'Messaging & Routing',
  conversation: 'Workflow Chat',
  'coding-concept': 'Terminology',
  lis: 'Laboratory',
  emr: 'Electronic Health Record',
  admin: 'Administration',
  website: 'Website Content',
  identity: 'Identity & Access',
};
