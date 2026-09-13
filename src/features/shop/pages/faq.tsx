import { Accordion, Box, Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { MessageCircle, Mail } from 'lucide-react';
import {
  WebsiteLayout,
  green,
  darkGreen,
  ink,
  muted,
  line,
  soft,
  buttonStyles,
} from '../website/layout';

const faqs = [
  {
    question: 'How do I place an order?',
    answer:
      'Browse our catalogue and add medicines to your cart. At checkout, upload your prescription if required, choose your delivery address and select a payment method. After confirming your order, our pharmacists will review it and you will receive dispatch updates via SMS and WhatsApp.',
  },
  {
    question: 'Do I need a prescription?',
    answer:
      'Some medicines require a valid prescription from a licensed doctor. Prescription-only medicines (antibiotics, hypertension drugs, insulin, etc.) cannot be dispensed without one. Over-the-counter (OTC) products like vitamins, supplements, pain relievers and first aid items can be ordered freely. Our pharmacists verify each order to ensure compliance with regulatory requirements.',
  },
  {
    question: 'How does prescription upload work?',
    answer:
      'After adding items to your cart, you will be prompted to upload a clear photo or PDF of your prescription. A licensed Damorex pharmacist reviews the prescription to confirm the medicines, dosage and quantity match. If everything is correct, your order moves to dispatch. If there are any issues, our team will contact you via WhatsApp or phone to resolve them.',
  },
  {
    question: 'What areas do you deliver to?',
    answer:
      'We currently deliver across Lagos State, Ogun State and Oyo State. Coverage includes major cities and towns within these states. We are actively expanding to more regions. Enter your delivery address at checkout to confirm if we serve your location.',
  },
  {
    question: 'How much is delivery?',
    answer:
      'Delivery is free for orders above ₦10,000. For orders below ₦10,000, delivery fees range from ₦1,500 to ₦3,000 depending on your location and the delivery option selected. Express and scheduled delivery options may have different rates displayed at checkout.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept debit and credit cards (Visa, Mastercard, Verve), bank transfers, USSD payments and cash on delivery. All online payments are processed securely through encrypted payment gateways. Your payment information is never stored on our servers.',
  },
  {
    question: 'How long does delivery take?',
    answer:
      'Same-day delivery is available for orders placed before 2 PM within select zones. Scheduled delivery allows you to pick a convenient time slot. Express dispatch is available for urgent orders at an additional fee. Standard delivery typically takes 1 to 3 business days depending on your location.',
  },
  {
    question: 'Can I return medicines?',
    answer:
      'For safety and hygiene reasons, Damorex does not accept returns or exchanges on dispensed medicines once they have left the pharmacy. If you receive a damaged, expired or incorrect product, contact our support team within 24 hours of delivery and we will investigate and resolve the issue promptly.',
  },
  {
    question: 'How do I consult a pharmacist?',
    answer:
      'You can reach our pharmacists through WhatsApp chat, phone call or by booking a consultation on our website. Our pharmacists are available to answer medication questions, provide drug information, advise on dosage and help with refill management. Typical response time is under 5 minutes on WhatsApp during business hours.',
  },
  {
    question: 'Is my data safe?',
    answer:
      'Yes. Damorex takes data privacy and security seriously. All personal information, medical records and prescription data are encrypted and stored securely in compliance with Nigerian data protection regulations. We never share your data with third parties without your explicit consent. You can read our full privacy policy for more details.',
  },
];

export default function FaqPage() {
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
              Frequently Asked Questions
            </Title>
            <Text size="lg" lh={1.7} c="rgba(255,255,255,0.78)">
              Everything you need to know about ordering from Damorex
            </Text>
          </Stack>
        </Container>
      </Box>

      <Container size="xl" py={{ base: 48, md: 76 }}>
        <Box maw={860} mx="auto">
          <Accordion
            variant="separated"
            radius="xl"
            styles={{
              item: {
                borderColor: line,
                background: '#fff',
                marginBottom: 12,
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
              },
              control: {
                padding: '20px 24px',
                fontSize: 16,
                fontWeight: 900,
                color: ink,
              },
              panel: {
                padding: '0 24px 24px',
              },
              chevron: {
                color: green,
              },
            }}
          >
            {faqs.map((faq) => (
              <Accordion.Item key={faq.question} value={faq.question}>
                <Accordion.Control>{faq.question}</Accordion.Control>
                <Accordion.Panel>
                  <Text c={muted} lh={1.7}>
                    {faq.answer}
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Box>
      </Container>

      <Box py={{ base: 48, md: 64 }} style={{ background: soft }}>
        <Container size="xl">
          <Stack gap={20} align="center" style={{ textAlign: 'center' }}>
            <Title order={2} className="damorex-heading" c={ink}>
              Still have questions?
            </Title>
            <Text c={muted} size="lg" lh={1.7} maw={520}>
              Our support team and pharmacists are ready to help with any questions you may have.
            </Text>
            <Group>
              <Button
                radius="xl"
                size="md"
                leftSection={<Mail size={18} />}
                styles={buttonStyles}
                style={{ background: green }}
              >
                Contact Us
              </Button>
              <Button
                radius="xl"
                size="md"
                variant="outline"
                leftSection={<MessageCircle size={18} />}
                styles={buttonStyles}
                style={{
                  borderColor: '#B9D9C6',
                  color: darkGreen,
                  background: '#fff',
                }}
                onClick={() => window.open('https://wa.me/234', '_blank')}
              >
                WhatsApp Us
              </Button>
            </Group>
          </Stack>
        </Container>
      </Box>
    </WebsiteLayout>
  );
}
