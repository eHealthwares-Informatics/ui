import { Box, Container, Stack, Text, Title } from '@mantine/core';
import { WebsiteLayout, green, darkGreen, ink, muted } from '../website/layout';

const sections = [
  {
    title: 'Information We Collect',
    content:
      'When you use Damorex, we collect information that you provide directly, including your name, email address, phone number, delivery address, payment details and medical information such as prescriptions and health history relevant to your orders. We also collect technical information automatically, including your IP address, device type, browser information and how you interact with our website. This data helps us process orders, verify prescriptions and improve your experience on our platform.',
  },
  {
    title: 'How We Use Your Information',
    content:
      'The information we collect is used to process and fulfil your orders, verify prescriptions with our licensed pharmacists, communicate order updates via SMS, WhatsApp or email, provide customer support and pharmacist consultations, send health tips, refill reminders and promotional offers (with your consent), improve our website functionality and user experience, and comply with legal and regulatory obligations applicable to pharmacy operations in Nigeria.',
  },
  {
    title: 'Data Protection & Security',
    content:
      'Damorex employs industry-standard security measures to protect your personal and medical information. All data transmitted between your browser and our servers is encrypted using SSL/TLS protocols. Your prescription data and medical history are stored with additional encryption layers and accessed only by authorised pharmacy personnel. We conduct regular security audits and adhere to the data protection principles outlined in the Nigeria Data Protection Regulation (NDPR). Despite these measures, no electronic storage or transmission method is completely secure, and we encourage you to take precautions when sharing sensitive information online.',
  },
  {
    title: 'Sharing of Information',
    content:
      'We do not sell, rent or trade your personal information to third parties. Your data may be shared with trusted partners who assist in order fulfilment — such as payment processors, logistics providers and pharmaceutical suppliers — solely for the purpose of completing your transaction. These partners are contractually bound to protect your data and may not use it for any other purpose. We may also disclose information when required by law, court order or regulatory authority in compliance with Nigerian pharmaceutical and data protection regulations.',
  },
  {
    title: 'Your Rights',
    content:
      'You have the right to access the personal data we hold about you, request corrections to inaccurate or incomplete information, withdraw consent for marketing communications at any time, request deletion of your account and associated data where permitted by law, and request a copy of your data in a portable format. To exercise any of these rights, please contact our Data Protection Officer using the details below. We will respond to your request within the timeframe required by applicable law.',
  },
  {
    title: 'Cookies',
    content:
      'Damorex uses cookies and similar tracking technologies to enhance your browsing experience, remember your preferences, analyse site traffic and support our marketing efforts. Cookies are small text files stored on your device by your web browser. You can control cookie preferences through your browser settings. Disabling certain cookies may affect the functionality of our website, including the ability to place orders or use your account. We use both session cookies (which expire when you close your browser) and persistent cookies (which remain for a set period).',
  },
  {
    title: 'Contact Us',
    content:
      'If you have any questions, concerns or requests regarding this Privacy Policy or how Damorex handles your data, please contact our Data Protection Officer via email at privacy@damorexpharmacy.com, by phone at +234 800 DAMOREX, or by visiting any of our branch locations. We are committed to addressing your concerns promptly and transparently. This policy may be updated periodically, and we will notify you of material changes via email or a notice on our website.',
  },
];

export default function PrivacyPage() {
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
              Privacy Policy
            </Title>
            <Text size="lg" lh={1.7} c="rgba(255,255,255,0.78)">
              How Damorex collects, uses and protects your personal and medical information.
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
