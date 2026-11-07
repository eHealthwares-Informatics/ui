import { UnstyledButton } from '@mantine/core';
import { ChevronRight } from 'lucide-react';
import type { ModuleId } from '@/features/shared/module-data';
import {
  moduleCardFallbackIcons,
  moduleCards,
  modulePlans,
  type ModuleAccent,
} from '@/features/shared/module-meta';
import type { ModuleInfo } from '@/stores/auth-store';
import classes from './module-card.module.css';

type ModuleCardProps = {
  module: ModuleInfo;
  onSelect: (moduleId: ModuleId) => void;
};

const accentClass: Record<ModuleAccent, string> = {
  green: classes.accentGreen,
  teal: classes.accentTeal,
  purple: classes.accentPurple,
  indigo: classes.accentIndigo,
  sky: classes.accentSky,
  blue: classes.accentBlue,
  red: classes.accentRed,
  orange: classes.accentOrange,
  slate: classes.accentSlate,
};

/**
 * One module tile on the landing grid: tinted card, 3D hex icon, value copy and
 * a chevron affordance. Falls back to the module's own name/description and a
 * lucide icon for modules without dedicated presentation metadata.
 */
export function ModuleCard({ module, onSelect }: ModuleCardProps) {
  const meta = moduleCards[module.id];
  const FallbackIcon = moduleCardFallbackIcons[module.id];
  const title = meta?.title ?? module.name;
  const description = meta?.description ?? modulePlans[module.id] ?? module.description;
  const accent = meta?.accent ?? 'slate';

  return (
    <UnstyledButton
      className={`${classes.card} ${accentClass[accent]}`}
      onClick={() => onSelect(module.id as ModuleId)}
      data-testid={`module-card-${module.id}`}
    >
      <span className={classes.header}>
        {meta?.icon ? (
          <img
            className={classes.icon}
            src={meta.icon}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        ) : FallbackIcon ? (
          <span className={classes.iconFallback} aria-hidden="true">
            <FallbackIcon size={26} strokeWidth={1.8} />
          </span>
        ) : (
          <span className={classes.iconFallback} aria-hidden="true" />
        )}
        <span className={classes.arrow} aria-hidden="true">
          <ChevronRight size={15} strokeWidth={2.75} />
        </span>
      </span>

      <span className={classes.body}>
        <span className={classes.title} data-testid={`module-card-${module.id}-title`}>
          {title}
        </span>
        <span className={classes.description}>{description}</span>
      </span>
    </UnstyledButton>
  );
}
