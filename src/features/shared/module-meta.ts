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

/** Lucide fallback used by the landing cards when no 3D hex icon ships. */
export const moduleCardFallbackIcons: Record<string, React.ElementType> = {
  'coding-concept': Boxes,
  admin: Shield,
  website: Globe,
};

export type ModuleAccent =
  | 'green'
  | 'teal'
  | 'purple'
  | 'indigo'
  | 'sky'
  | 'blue'
  | 'red'
  | 'orange'
  | 'slate';

export type ModuleCardMeta = {
  /** Product-facing headline shown on the card. */
  title: string;
  /** One-line value statement shown under the headline. */
  description: string;
  accent: ModuleAccent;
  /** 3D hex icon served from /public/assets/module-icons. */
  icon?: string;
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
 * Presentation metadata for the module landing cards. Modules missing from this
 * map still render — the grid falls back to the module's own name/description
 * and a neutral accent.
 */
export const moduleCards: Record<string, ModuleCardMeta> = {
  rxsoft: {
    title: 'Formulary integrated Rx inventory',
    description: 'Pharmacy inventory with formulary and e-prescribing integration.',
    accent: 'green',
    icon: '/assets/module-icons/rx-pills.png',
  },
  conversation: {
    title: 'Omnichannel integration with Workflows',
    description: 'Connect channels, people and data through intelligent workflows.',
    accent: 'teal',
    icon: '/assets/module-icons/chat.png',
  },
  communication: {
    title: 'CareSwitch',
    description: 'Interoperability — messaging and routing.',
    accent: 'purple',
    icon: '/assets/module-icons/bars-pulse.png',
  },
  'coding-concept': {
    title: 'Healthcare concept resource management',
    description: 'Manage medical concepts, guidelines and clinical resources.',
    accent: 'indigo',
  },
  lis: {
    title: 'OmniLab',
    description: 'Laboratory diagnostics ordering and workflow.',
    accent: 'sky',
    icon: '/assets/module-icons/labtest.png',
  },
  emr: {
    title: 'Prognocare EMR',
    description: 'Meaningful use of collected healthcare data.',
    accent: 'red',
    icon: '/assets/module-icons/heart-cross.png',
  },
  admin: {
    title: 'Admin Console',
    description: 'Administration and system management.',
    accent: 'slate',
  },
  website: {
    title: 'RxShop',
    description: 'Website and mobile store fronts.',
    accent: 'orange',
    icon: '/assets/module-icons/cash-naira.png',
  },
  identity: {
    title: 'Security of Organisation, Users, Locations',
    description: 'Manage access, protect data, ensure compliance.',
    accent: 'blue',
    icon: '/assets/module-icons/lock.png',
  },
};
