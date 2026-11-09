// hooks/use-enhanced-view.ts

import { useMemo } from 'react';
import { useViewProvider } from '@/context/view-provider';
import { View } from '@/features/rxsoft/types';
import { buildAttributeFields } from './dynamic';

export function useEnhancedCodingConceptView<T>(view: View<T>, moduleId: string, index?: number) {
  const { getAttributes } = useViewProvider();

  const attributes = getAttributes(moduleId);

  return useMemo(() => {
    if (!attributes) {
      return null;
    }
    const dynamicFields = buildAttributeFields('conceptValues', attributes);
    const attributeGroup = {
      title: 'Attributes',
      fields: dynamicFields,
    };
    const fieldGroups = view.fieldGroups?.toSpliced(
      index || view.fieldGroups.length - 1,
      0,
      attributeGroup
    );
    return {
      ...view,
      fieldGroups,
    };
  }, [view, attributes]);
}
