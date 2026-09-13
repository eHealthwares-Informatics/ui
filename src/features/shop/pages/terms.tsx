import { Box, Container, Stack, Text, Title } from '@mantine/core';
import { WebsiteLayout, green, darkGreen, ink, muted } from '../website/layout';

const sections = [
  {
    title: 'Use of Service',
    content:
      'By accessing or using the Damorex website and services, you agree to be bound by these Terms of Service. Damorex provides an online platform for ordering pharmaceutical products, uploading prescriptions, consulting with licensed pharmacists and receiving medicine deliveries. You must be at least 18 years old to create an account or place an order. If you are under 18, you may use the service only under the supervision of a parent or legal guardian. You agree to use the platform only for lawful purposes and in compliance with all applicable Nigerian laws and regulations governing pharmaceutical sales and healthcare services.',
  },
  {
    title: 'Account Registration',
    content:
      'To place orders, you must create an account by providing accurate, current and complete information including your full name, valid phone number, email address and delivery address. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify Damorex immediately of any unauthorised use of your account. Damorex reserves the right to suspend or terminate accounts that provide false information, violate these terms or engage in fraudulent activity. Account sharing is not permitted.',
  },
  {
    title: 'Orders & Payments',
    content:
      'All orders placed through Damorex are subject to availability and pharmacist verification. Prices displayed on the website are in Nigerian Naira (NGN) and include applicable taxes unless stated otherwise. Damorex reserves the right to modify prices, but any changes will not affect orders already confirmed. Payment must be made in full at the time of ordering unless a credit or payment plan has been expressly agreed in writing. Accepted payment methods include debit cards, credit cards, bank transfers, USSD and cash on delivery. If a payment is declined or reversed, Damorex may cancel the order and suspend the account.',
  },
  {
    title: 'Prescriptions',
    content:
      'Prescription-only medicines will only be dispensed upon receipt and verification of a valid prescription issued by a licensed medical practitioner. Damorex pharmacists reserve the right to refuse or cancel any order if the prescription appears invalid, altered, expired or inappropriate for the requested medication. By submitting a prescription, you confirm that it is genuine and has been issued for your own use or for the person named on the prescription. Fraudulent prescription submissions may be reported to the relevant regulatory authorities, including the Pharmacists Council of Nigeria.',
  },
  {
    title: 'Delivery & Returns',
    content:
      'Damorex delivers to addresses within Lagos, Ogun and Oyo states. Delivery times are estimates and not guaranteed, though we make every effort to meet the selected delivery window. Risk of loss and title for medicines pass to you upon delivery. For safety and regulatory reasons, Damorex does not accept returns or exchanges on medicines once dispensed and delivered. If you receive a damaged, expired or incorrect product, you must contact us within 24 hours of delivery so we can investigate and arrange a resolution. Damorex reserves the right to refuse delivery to addresses deemed unsafe or inaccessible.',
  },
  {
    title: 'Limitation of Liability',
    content:
      'Damorex provides its services on an "as is" and "as available" basis. While we strive for accuracy, we do not warrant that product descriptions, pricing or availability are error-free. To the maximum extent permitted by law, Damorex and its affiliates, pharmacists, employees and agents shall not be liable for any indirect, incidental, special or consequential damages arising from the use or inability to use our services. This includes damages for loss of profits, data or goodwill. Damorex total liability for any claim arising from these terms or your use of the service is limited to the amount you paid for the specific order giving rise to the claim.',
  },
  {
    title: 'Governing Law',
    content:
      'These Terms of Service are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising out of or relating to these terms or the use of Damorex services shall be subject to the exclusive jurisdiction of the courts in Lagos State, Nigeria. Damorex makes no representation that the services are appropriate or available for use outside Nigeria. Users accessing the platform from outside Nigeria do so at their own risk and are responsible for compliance with local laws.',
  },
  {
    title: 'Changes to Terms',
    content:
      'Damorex reserves the right to update or modify these Terms of Service at any time without prior notice. Changes will be effective immediately upon posting on this page. We encourage you to review these terms periodically. Your continued use of the Damorex platform after any changes constitutes acceptance of the revised terms. If you do not agree with any modification, you must stop using the service and close your account. Material changes will be communicated via email or a prominent notice on our website.',
  },
];

export default function TermsPage() {
  return (
    <WebsiteLayout>
      <Box
        py={{ base: 48, md: 72 }}
        style={{
          background: `linear-gradient(135deg, ${darkGreen} 0%, #0B4A28 50%, #0F172A 100%)`,
          color: '#fff',
        }}
      >
        <Container size="xl">
          <Stack gap={16} maw={760}>
            <Title order={1} className="damorex-heading hero-title">
              Terms of Service
            </Title>
            <Text size="lg" lh={1.7} c="rgba(255,255,255,0.78)">
              Please read these terms carefully before using Damorex services.
            </Text>
          </Stack>
        </Container>
      </Box>

      <Container size="xl" py={{ base: 48, md: 76 }}>
        <Box maw={860} mx="auto">
          <Stack gap={36}>
            {sections.map((section) => (
              <Stack key={section.title} gap={8}>
                <Title order={2} className="damorex-heading" size="h3" c={ink}>
                  {section.title}
                </Title>
                <Text c={muted} lh={1.7}>
                  {section.content}
                </Text>
              </Stack>
            ))}

            <Text size="sm" c={muted} mt="md">
              Last updated: January 2026. Damorex Pharmacy. All rights reserved.
            </Text>
          </Stack>
        </Box>
      </Container>
    </WebsiteLayout>
  );
}
