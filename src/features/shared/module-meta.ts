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

/**
 * Module brand assets — 3D hex icon images used in the TeamSwitcher and module
 * landing cards. Modules without a dedicated image fall back to their lucide
 * icon in `moduleIcons`.
 */
export const moduleCards: Record<string, { icon: string }> = {
  rxsoft: { icon: '/assets/module-icons/rx-pills.png' },
  communication: { icon: '/assets/module-icons/bars-pulse.png' },
  conversation: { icon: '/assets/module-icons/chat.png' },
  lis: { icon: '/assets/module-icons/labtest.png' },
  emr: { icon: '/assets/module-icons/heart-cross.png' },
  admin: { icon: '/assets/module-icons/lock.png' },
  identity: { icon: '/assets/module-icons/lock.png' },
};
