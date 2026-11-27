import { Stack } from '@mantine/core';
import { ContentSection } from '../../components/content-section';
import { AllowedModulesConfig } from '../allowed-modules-config';
import { BasicInformationSection } from '../sections/basic-information-section';
import { ModuleAccountSection } from '../sections/module-account-section';
import { NotificationsSection } from '../sections/notifications-section';
import { SessionSection } from '../sections/session-section';
import { TwoFactorSection } from '../sections/two-factor-section';

export function SettingsAccount() {
  return (
    <ContentSection title="Account" desc="Update your account settings.">
      <Stack gap="xl">
        <BasicInformationSection />
        <SessionSection />
        <ModuleAccountSection />
        <NotificationsSection />
        <TwoFactorSection />
        <AllowedModulesConfig />
      </Stack>
    </ContentSection>
  );
}
