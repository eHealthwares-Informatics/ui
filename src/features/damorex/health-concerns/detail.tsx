import {
  Box,
  Button,
  Container,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  Activity,
  AlertTriangle,
  Apple,
  Baby,
  Ban,
  Bed,
  Brain,
  Bug,
  ChevronRight,
  Droplets,
  Dumbbell,
  Heart,
  Hospital,
  Pill,
  ShieldCheck,
  Thermometer,
  User,
  Weight,
  Wind,
  AlertCircle,
  Stethoscope,
  Sparkles,
  Moon,
  HeartPulse,
  ExternalLink,
  Eye,
  CalendarClock,
  MessageCircle,
  MessageSquare,
} from 'lucide-react';
import { useChatbotStore } from '../website/chatbot-store';
import {
  toHL7Prescription,
  buildWhatsAppUrl,
  WEBSITE_PRESCRIPTION_PHONE,
  QUESTIONNAIRE_CODES,
} from '../website/hl7-prescription';
import { SectionHeading, PrimaryButton, OutlineButton, ProductCard } from '../website/components';
import { useHealthConcernBySlug } from '../website/hooks';
import { WebsiteLayout, green, darkGreen, ink, muted, line, soft } from '../website/layout';
import type { BlogArticleView } from '../website/types';

function PageLoader() {
  return (
    <Container size="xl" py={80}>
      <Stack align="center" gap="md">
        <Box
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: `4px solid ${line}`,
            borderTopColor: green,
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <Text c={muted}>Loading health information...</Text>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </Stack>
    </Container>
  );
}

interface Symptom {
  icon: React.ElementType;
  label: string;
  description: string;
}

interface Prevention {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface WarningSign {
  icon: React.ElementType;
  sign: string;
}

interface ConditionContent {
  icon: React.ElementType;
  overview: string;
  overviewDetail: string;
  symptoms: Symptom[];
  prevention: Prevention[];
  warningSigns: WarningSign[];
}

const conditionContentMap: Record<string, ConditionContent> = {
  malaria: {
    icon: Bug,
    overview:
      'Malaria is a life-threatening disease caused by parasites transmitted through the bites of infected female Anopheles mosquitoes. It is preventable and curable, but without prompt treatment, it can lead to severe complications.',
    overviewDetail:
      'Malaria remains one of the most significant public health challenges in Nigeria and across sub-Saharan Africa. The disease is caused by Plasmodium parasites, with Plasmodium falciparum being the most dangerous species. When an infected mosquito bites a person, the parasites enter the bloodstream and travel to the liver, where they mature and multiply. After several days, the parasites re-enter the bloodstream and infect red blood cells, leading to the characteristic symptoms of malaria. Early diagnosis and treatment are critical to prevent severe illness and death.',
    symptoms: [
      {
        icon: Thermometer,
        label: 'High Fever',
        description: 'Sudden onset of high temperature, often exceeding 38°C',
      },
      {
        icon: Activity,
        label: 'Chills & Rigors',
        description: 'Severe shivering and cold sensations alternating with fever',
      },
      {
        icon: Brain,
        label: 'Headache',
        description: 'Persistent and often severe headache',
      },
      {
        icon: Droplets,
        label: 'Nausea & Vomiting',
        description: 'Feeling sick and vomiting, sometimes with diarrhea',
      },
      {
        icon: Bug,
        label: 'Muscle Pain',
        description: 'Generalized body aches and joint pain',
      },
      {
        icon: Moon,
        label: 'Fatigue',
        description: 'Extreme tiredness and weakness lasting for days',
      },
    ],
    prevention: [
      {
        icon: Bed,
        title: 'Sleep Under Mosquito Nets',
        description:
          'Use insecticide-treated mosquito nets (ITNs) every night to create a protective barrier while you sleep.',
      },
      {
        icon: Ban,
        title: 'Use Insect Repellents',
        description:
          'Apply DEET-based mosquito repellents on exposed skin, especially during dusk and dawn when mosquitoes are most active.',
      },
      {
        icon: Pill,
        title: 'Take Antimalarials',
        description:
          'Take prophylactic antimalarial medications as prescribed, especially if you are pregnant or traveling to high-risk areas.',
      },
      {
        icon: ShieldCheck,
        title: 'Eliminate Breeding Sites',
        description:
          'Remove standing water around your home where mosquitoes breed, and keep your environment clean.',
      },
    ],
    warningSigns: [
      {
        icon: AlertTriangle,
        sign: 'Persistent high fever not responding to medication',
      },
      {
        icon: AlertTriangle,
        sign: 'Confusion, drowsiness, or loss of consciousness',
      },
      {
        icon: AlertTriangle,
        sign: 'Difficulty breathing or rapid breathing',
      },
      {
        icon: AlertTriangle,
        sign: 'Dark or bloody urine (blackwater fever)',
      },
      {
        icon: AlertTriangle,
        sign: 'Severe vomiting unable to keep down fluids',
      },
    ],
  },
  diabetes: {
    icon: HeartPulse,
    overview:
      'Diabetes mellitus is a chronic metabolic disorder characterized by elevated blood sugar levels. It occurs when the pancreas does not produce enough insulin or when the body cannot effectively use the insulin it produces.',
    overviewDetail:
      'Diabetes is a lifelong condition that affects how your body turns food into energy. There are two main types: Type 1 diabetes, where the immune system attacks insulin-producing cells, and Type 2 diabetes, where the body becomes resistant to insulin. Type 2 diabetes is far more common and is often linked to lifestyle factors such as obesity, poor diet, and lack of physical activity. Gestational diabetes also occurs during pregnancy. Managing diabetes involves blood sugar monitoring, medication, healthy eating, and regular physical activity. Uncontrolled diabetes can lead to serious complications including heart disease, kidney failure, blindness, and amputation.',
    symptoms: [
      {
        icon: Droplets,
        label: 'Frequent Urination',
        description: 'Needing to urinate often, especially at night',
      },
      {
        icon: Thermometer,
        label: 'Excessive Thirst',
        description: 'Persistent dry mouth and unquenchable thirst',
      },
      {
        icon: Moon,
        label: 'Fatigue',
        description: 'Constant tiredness and lack of energy throughout the day',
      },
      {
        icon: Weight,
        label: 'Unexplained Weight Loss',
        description: 'Losing weight despite eating normally or more than usual',
      },
      {
        icon: Eye,
        label: 'Blurred Vision',
        description: 'Sudden or gradual changes in eyesight clarity',
      },
      {
        icon: Activity,
        label: 'Slow Wound Healing',
        description: 'Cuts and sores taking longer than usual to heal',
      },
    ],
    prevention: [
      {
        icon: Apple,
        title: 'Maintain a Healthy Diet',
        description:
          'Eat a balanced diet rich in fiber, whole grains, lean proteins, and plenty of vegetables. Limit sugary drinks and refined carbohydrates.',
      },
      {
        icon: Dumbbell,
        title: 'Exercise Regularly',
        description:
          'Engage in at least 30 minutes of moderate physical activity daily, such as brisk walking, cycling, or swimming.',
      },
      {
        icon: Weight,
        title: 'Maintain Healthy Weight',
        description:
          'Keep your body mass index (BMI) within a healthy range. Losing 5-7% of body weight can significantly reduce diabetes risk.',
      },
      {
        icon: Activity,
        title: 'Monitor Blood Sugar',
        description:
          'Regularly check your blood glucose levels if you are at risk, and have annual health screenings including HbA1c tests.',
      },
    ],
    warningSigns: [
      {
        icon: AlertTriangle,
        sign: 'Very high blood sugar (hyperglycemia) above 250 mg/dL',
      },
      {
        icon: AlertTriangle,
        sign: 'Signs of diabetic ketoacidosis: fruity breath, nausea, abdominal pain',
      },
      {
        icon: AlertTriangle,
        sign: 'Non-healing foot ulcers or infections on the feet',
      },
      {
        icon: AlertTriangle,
        sign: 'Sudden vision changes or loss of sight',
      },
      {
        icon: AlertTriangle,
        sign: 'Chest pain, shortness of breath, or signs of heart attack',
      },
    ],
  },
  hypertension: {
    icon: Heart,
    overview:
      'Hypertension, or high blood pressure, is a common condition where the force of blood against artery walls is consistently too high. It often has no symptoms but can lead to serious health problems if untreated.',
    overviewDetail:
      'Blood pressure is measured as two numbers: systolic (pressure during heartbeats) and diastolic (pressure between beats). Hypertension is diagnosed when readings are consistently 130/80 mmHg or higher. Often called the "silent killer," hypertension typically has no warning signs until significant damage has occurred. It is a major risk factor for heart disease, stroke, kidney disease, and other serious conditions. While genetic factors play a role, lifestyle choices significantly influence blood pressure. Regular monitoring, medication adherence, and healthy habits can effectively manage hypertension and prevent complications.',
    symptoms: [
      {
        icon: Brain,
        label: 'Severe Headaches',
        description: 'Persistent headaches, especially at the back of the head',
      },
      {
        icon: Wind,
        label: 'Shortness of Breath',
        description: 'Difficulty breathing during normal activities',
      },
      {
        icon: Droplets,
        label: 'Nosebleeds',
        description: 'Frequent or unexplained nosebleeds',
      },
      {
        icon: Heart,
        label: 'Chest Pain',
        description: 'Discomfort or tightness in the chest area',
      },
      {
        icon: Moon,
        label: 'Dizziness',
        description: 'Feeling lightheaded or dizzy, especially when standing',
      },
      {
        icon: Activity,
        label: 'Vision Changes',
        description: 'Blurred or double vision in severe cases',
      },
    ],
    prevention: [
      {
        icon: Apple,
        title: 'Reduce Sodium Intake',
        description:
          'Limit salt consumption to less than 5g per day. Avoid processed foods, canned goods, and add less salt to cooking.',
      },
      {
        icon: Dumbbell,
        title: 'Exercise Regularly',
        description:
          'Aim for 150 minutes of moderate aerobic activity per week, such as jogging, swimming, or brisk walking.',
      },
      {
        icon: Brain,
        title: 'Manage Stress',
        description:
          'Practice relaxation techniques like deep breathing, meditation, or yoga to lower stress hormones that raise blood pressure.',
      },
      {
        icon: Apple,
        title: 'Eat a Balanced Diet',
        description:
          'Follow the DASH diet rich in fruits, vegetables, whole grains, and low-fat dairy while reducing saturated fats.',
      },
    ],
    warningSigns: [
      {
        icon: AlertTriangle,
        sign: 'Blood pressure reading above 180/120 mmHg (hypertensive crisis)',
      },
      {
        icon: AlertTriangle,
        sign: 'Sudden severe headache with confusion or vision changes',
      },
      {
        icon: AlertTriangle,
        sign: 'Chest pain radiating to the arm or jaw',
      },
      {
        icon: AlertTriangle,
        sign: 'Difficulty speaking or weakness on one side of the body',
      },
      {
        icon: AlertTriangle,
        sign: 'Sudden shortness of breath or coughing up blood',
      },
    ],
  },
  asthma: {
    icon: Wind,
    overview:
      'Asthma is a chronic respiratory condition where the airways become inflamed, narrow, and swell, producing extra mucus. This makes breathing difficult and triggers coughing, wheezing, and shortness of breath.',
    overviewDetail:
      'Asthma affects the bronchial tubes that carry air in and out of the lungs. In asthma, these airways are hypersensitive and react to triggers by becoming inflamed and constricted. While asthma cannot be cured, it can be effectively managed with proper treatment and trigger avoidance. Asthma affects people of all ages and often starts in childhood. The condition varies in severity from person to person, and asthma attacks can range from mild to life-threatening. With appropriate medication, an asthma action plan, and regular monitoring, most people with asthma can lead full and active lives.',
    symptoms: [
      {
        icon: Wind,
        label: 'Wheezing',
        description: 'A whistling sound when breathing, especially when exhaling',
      },
      {
        icon: Wind,
        label: 'Coughing',
        description: 'Persistent cough, particularly at night, during exercise, or when laughing',
      },
      {
        icon: AlertCircle,
        label: 'Chest Tightness',
        description: 'Feeling like something is squeezing or sitting on your chest',
      },
      {
        icon: Wind,
        label: 'Shortness of Breath',
        description: 'Difficulty catching your breath or feeling out of breath easily',
      },
      {
        icon: Moon,
        label: 'Nighttime Awakening',
        description: 'Waking up due to coughing, wheezing, or breathing difficulty',
      },
      {
        icon: Ban,
        label: 'Trigger Sensitivity',
        description: 'Symptoms worsening with pollen, dust, smoke, or cold air',
      },
    ],
    prevention: [
      {
        icon: Ban,
        title: 'Avoid Triggers',
        description:
          'Identify and avoid personal asthma triggers such as dust mites, pollen, mold, pet dander, smoke, and strong odors.',
      },
      {
        icon: Pill,
        title: 'Use Preventive Inhalers',
        description:
          'Take controller medications (inhaled corticosteroids) as prescribed, even when you feel well, to reduce airway inflammation.',
      },
      {
        icon: ShieldCheck,
        title: 'Create a Clean Environment',
        description:
          'Use allergen-proof covers on bedding, vacuum regularly with HEPA filters, and maintain indoor humidity below 50%.',
      },
      {
        icon: Activity,
        title: 'Monitor Peak Flow',
        description:
          'Use a peak flow meter daily to track lung function and detect worsening asthma before symptoms appear.',
      },
    ],
    warningSigns: [
      {
        icon: AlertTriangle,
        sign: 'Reliever inhaler not working or needing it more than every 4 hours',
      },
      {
        icon: AlertTriangle,
        sign: 'Severe shortness of breath making it hard to speak or walk',
      },
      {
        icon: AlertTriangle,
        sign: 'Chest retractions (skin sucking in around ribs during breathing)',
      },
      {
        icon: AlertTriangle,
        sign: 'Blue lips or fingernails (cyanosis) indicating oxygen deprivation',
      },
      {
        icon: AlertTriangle,
        sign: 'Peak flow reading below 50% of personal best',
      },
    ],
  },
  'women-health': {
    icon: Heart,
    overview:
      "Women's health encompasses a broad range of health concerns unique to women, including reproductive health, pregnancy care, menstrual health, menopause management, and gender-specific wellness.",
    overviewDetail:
      "Comprehensive women's healthcare addresses physical, mental, and emotional well-being throughout every stage of life. From adolescence through reproductive years and into menopause, women face unique health challenges that require specialized attention. Regular gynecological check-ups, breast self-examinations, and cancer screenings (such as Pap smears and mammograms) are essential preventive measures. Common concerns include menstrual disorders, polycystic ovary syndrome (PCOS), endometriosis, uterine fibroids, pelvic inflammatory disease, and menopausal symptoms. Mental health, including postpartum depression and anxiety, is equally important. Proper nutrition, exercise, and stress management form the foundation of lifelong women's wellness.",
    symptoms: [
      {
        icon: Droplets,
        label: 'Menstrual Irregularities',
        description: 'Irregular, heavy, or painful periods that affect daily life',
      },
      {
        icon: Heart,
        label: 'Hormonal Changes',
        description: 'Mood swings, hot flashes, and other symptoms of hormonal fluctuation',
      },
      {
        icon: Baby,
        label: 'Pregnancy Concerns',
        description: 'Nausea, fatigue, and other pregnancy-related symptoms requiring care',
      },
      {
        icon: Brain,
        label: 'Pelvic Pain',
        description: 'Persistent or recurrent pain in the lower abdomen or pelvic region',
      },
      {
        icon: User,
        label: 'Urinary Changes',
        description: 'Frequent UTIs, incontinence, or discomfort during urination',
      },
      {
        icon: Moon,
        label: 'Fatigue & Mood Changes',
        description: 'Chronic fatigue, anxiety, or depression related to hormonal cycles',
      },
    ],
    prevention: [
      {
        icon: User,
        title: 'Regular Check-ups',
        description:
          'Schedule annual gynecological exams including Pap smears, breast exams, and STI screenings as recommended.',
      },
      {
        icon: Apple,
        title: 'Nutrition & Supplements',
        description:
          'Maintain a diet rich in iron, calcium, folic acid, and vitamin D. Take prenatal vitamins if planning pregnancy.',
      },
      {
        icon: Dumbbell,
        title: 'Stay Physically Active',
        description:
          'Engage in regular exercise including pelvic floor exercises (Kegels) to support reproductive health.',
      },
      {
        icon: Brain,
        title: 'Mental Health Care',
        description:
          'Prioritize stress management, adequate sleep, and seek support for postpartum or perimenopausal mental health concerns.',
      },
    ],
    warningSigns: [
      {
        icon: AlertTriangle,
        sign: 'Abnormal vaginal bleeding between periods or after menopause',
      },
      {
        icon: AlertTriangle,
        sign: 'Severe pelvic pain that interferes with daily activities',
      },
      {
        icon: AlertTriangle,
        sign: 'Lumps, swelling, or changes in breast tissue',
      },
      {
        icon: AlertTriangle,
        sign: 'Persistent fever or foul-smelling discharge suggesting infection',
      },
      {
        icon: AlertTriangle,
        sign: 'Thoughts of harming yourself or your baby (seek immediate help)',
      },
    ],
  },
  'child-health': {
    icon: Baby,
    overview:
      'Child health focuses on the physical, mental, and social well-being of children from infancy through adolescence. It encompasses preventive care, growth monitoring, immunization, nutrition, and management of childhood illnesses.',
    overviewDetail:
      'Ensuring optimal child health is one of the most important investments a society can make. From birth through adolescence, children undergo rapid physical and cognitive development that requires proper nutrition, regular health screenings, timely immunizations, and a safe environment. The first five years are especially critical for brain development and establishing lifelong health patterns. Common childhood health concerns include vaccine-preventable diseases, malnutrition, respiratory infections, diarrhea, malaria, and developmental delays. Regular well-child visits allow healthcare providers to monitor growth milestones, provide age-appropriate vaccinations, offer guidance to parents, and detect potential health issues early when they are most treatable.',
    symptoms: [
      {
        icon: Thermometer,
        label: 'Fever',
        description: 'Elevated body temperature often signaling an underlying infection',
      },
      {
        icon: Baby,
        label: 'Feeding Difficulties',
        description: 'Poor appetite, difficulty latching, or refusal to eat',
      },
      {
        icon: Weight,
        label: 'Growth Delays',
        description: 'Failing to meet expected height and weight milestones',
      },
      {
        icon: Wind,
        label: 'Respiratory Symptoms',
        description: 'Coughing, difficulty breathing, or rapid breathing',
      },
      {
        icon: Droplets,
        label: 'Diarrhea & Dehydration',
        description: 'Frequent loose stools with signs of fluid loss',
      },
      {
        icon: Activity,
        label: 'Developmental Delays',
        description: 'Not reaching developmental milestones like sitting, crawling, or talking',
      },
    ],
    prevention: [
      {
        icon: ShieldCheck,
        title: 'Complete Immunization Schedule',
        description:
          'Follow the national immunization schedule to protect your child against preventable diseases like polio, measles, and pneumonia.',
      },
      {
        icon: Apple,
        title: 'Breastfeeding & Nutrition',
        description:
          'Exclusive breastfeeding for the first 6 months, followed by appropriate complementary feeding with diverse nutritious foods.',
      },
      {
        icon: Activity,
        title: 'Regular Growth Monitoring',
        description:
          'Attend well-child visits for height, weight, and developmental milestone tracking to detect issues early.',
      },
      {
        icon: Ban,
        title: 'Safe Environment',
        description:
          'Childproof your home, practice good hygiene, and ensure safe sleep practices to prevent accidents and infections.',
      },
    ],
    warningSigns: [
      {
        icon: AlertTriangle,
        sign: 'Fever above 38°C (100.4°F) in an infant under 3 months',
      },
      {
        icon: AlertTriangle,
        sign: 'Difficulty breathing, chest retractions, or grunting sounds',
      },
      {
        icon: AlertTriangle,
        sign: 'Signs of severe dehydration: dry mouth, sunken eyes, no tears, no urine for 6+ hours',
      },
      {
        icon: AlertTriangle,
        sign: 'Persistent vomiting, especially green or bloody vomit',
      },
      {
        icon: AlertTriangle,
        sign: 'Seizures, unusual drowsiness, or difficulty waking up',
      },
    ],
  },
};

const defaultContent: ConditionContent = {
  icon: Stethoscope,
  overview:
    'Understanding your health concern is the first step toward effective management and recovery. This condition requires proper medical attention and lifestyle adjustments.',
  overviewDetail:
    'Every health condition affects individuals differently, and understanding the specific nature of your concern is essential for proper management. While general information can help you recognize symptoms and take preventive measures, it is important to consult with healthcare professionals for an accurate diagnosis and personalized treatment plan. At Damorex, we are committed to providing you with reliable health information and access to quality medications and healthcare services to support your wellness journey.',
  symptoms: [
    {
      icon: Thermometer,
      label: 'Fever',
      description: 'Elevated body temperature indicating possible infection',
    },
    {
      icon: Moon,
      label: 'Fatigue',
      description: 'Persistent tiredness and reduced energy levels',
    },
    {
      icon: Brain,
      label: 'General Discomfort',
      description: 'Mild to moderate body aches and unease',
    },
    {
      icon: Activity,
      label: 'Changes in Appetite',
      description: 'Decreased or increased appetite without obvious cause',
    },
  ],
  prevention: [
    {
      icon: Apple,
      title: 'Healthy Diet',
      description:
        'Maintain a balanced diet rich in fruits, vegetables, and whole grains to support your immune system.',
    },
    {
      icon: Dumbbell,
      title: 'Regular Exercise',
      description:
        'Stay physically active with at least 30 minutes of moderate exercise most days of the week.',
    },
    {
      icon: Moon,
      title: 'Adequate Rest',
      description:
        'Get 7-8 hours of quality sleep each night to allow your body to repair and regenerate.',
    },
    {
      icon: User,
      title: 'Stay Hydrated',
      description: 'Drink plenty of water throughout the day to support all bodily functions.',
    },
  ],
  warningSigns: [
    {
      icon: AlertTriangle,
      sign: 'Symptoms persisting for more than a week despite home care',
    },
    {
      icon: AlertTriangle,
      sign: 'Sudden worsening of symptoms or severe pain',
    },
    {
      icon: AlertTriangle,
      sign: 'High fever above 39°C (102°F) not responding to medication',
    },
    {
      icon: AlertTriangle,
      sign: 'Difficulty breathing, chest pain, or confusion',
    },
  ],
};

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function getContent(slug: string): ConditionContent {
  return conditionContentMap[slug] || defaultContent;
}

function KnownAsBadge({ label }: { label: string }) {
  return (
    <Text
      size="xs"
      fw={800}
      style={{
        background: 'rgba(255,255,255,0.18)',
        color: '#fff',
        padding: '4px 14px',
        borderRadius: 999,
        backdropFilter: 'blur(4px)',
      }}
    >
      {label}
    </Text>
  );
}

export default function HealthConcernDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams({ from: '/shop/health-concerns/$slug' });
  const { data, isLoading } = useHealthConcernBySlug(slug);
  const content = getContent(slug);
  const IconComponent = content.icon;

  if (isLoading) {
    return (
      <WebsiteLayout>
        <PageLoader />
      </WebsiteLayout>
    );
  }

  if (!data?.concern) {
    return (
      <WebsiteLayout>
        <Container size="xl" py={80}>
          <Stack align="center" gap="md">
            <AlertCircle size={48} color={muted} />
            <Title order={2} className="damorex-heading" style={{ color: ink }}>
              Health Concern Not Found
            </Title>
            <Text c={muted} maw={480} ta="center" lh={1.7}>
              We could not find information for this health concern. It may have been removed or the
              link may be incorrect.
            </Text>
            <OutlineButton onClick={() => navigate({ to: '/shop/health-concerns' })}>
              Browse Health Concerns
            </OutlineButton>
          </Stack>
        </Container>
      </WebsiteLayout>
    );
  }

  const { concern, products, articles } = data;

  return (
    <WebsiteLayout>
      {/* ── Hero Section ───────────────────────────────────────── */}
      <Box
        style={{
          background: `radial-gradient(circle at 15% 20%, rgba(22,163,74,0.32), transparent 38%), radial-gradient(circle at 85% 30%, rgba(14,165,233,0.2), transparent 30%), radial-gradient(circle at 50% 80%, rgba(15,111,53,0.18), transparent 35%), linear-gradient(135deg, ${darkGreen} 0%, #0D4D2B 50%, #0A3A1F 100%)`,
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        <Container size="xl" py={{ base: 48, md: 72 }}>
          <Grid align="center" gap="xl">
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Stack gap="md">
                <Group gap={8}>
                  <KnownAsBadge label="Health Concern" />
                  {concern.description ? <KnownAsBadge label="Medical Guide" /> : null}
                </Group>
                <Title
                  order={1}
                  className="damorex-heading"
                  style={{
                    color: '#fff',
                    fontSize: 'clamp(2rem, 5vw, 3.4rem)',
                    lineHeight: 1.05,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {concern.name}
                </Title>
                {concern.description ? (
                  <Text size="lg" lh={1.7} maw={620} style={{ color: 'rgba(255,255,255,0.82)' }}>
                    {concern.description}
                  </Text>
                ) : null}
                <Group gap={12} pt="sm">
                  <PrimaryButton
                    leftSection={<ShoppingCartIcon />}
                    onClick={() => {
                      if (products?.length) {
                        navigate({
                          to: `/damorex/shop/${products[0].id}`,
                          params: { slug: products[0].id },
                        });
                      } else {
                        navigate({ to: '/shop/shop' });
                      }
                    }}
                  >
                    Shop Related Medicines
                  </PrimaryButton>
                  <Button
                    size="md"
                    radius="xl"
                    variant="outline"
                    leftSection={<MessageCircle size={18} />}
                    onClick={() => {
                      const url = `https://wa.me/${WEBSITE_PRESCRIPTION_PHONE.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${QUESTIONNAIRE_CODES.HEALTH_CONSULTATION}\r\nHello Damorex, I have a question about ${concern?.name || 'a health concern'}`)}`;
                      window.open(url, '_blank');
                    }}
                    style={{
                      borderColor: 'rgba(255,255,255,0.3)',
                      color: '#fff',
                      background: 'rgba(255,255,255,0.1)',
                    }}
                  >
                    Ask a Pharmacist
                  </Button>
                  <Button
                    size="md"
                    radius="xl"
                    variant="filled"
                    color="blue"
                    leftSection={<MessageSquare size={18} />}
                    onClick={() => {
                      const msg = `${QUESTIONNAIRE_CODES.HEALTH_CONSULTATION}\r\nI need information about ${concern?.name || 'a health concern'}`;
                      useChatbotStore.getState().openWith(msg, QUESTIONNAIRE_CODES.HEALTH_CONSULTATION);
                    }}
                  >
                    Chat
                  </Button>
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col
              span={{ base: 12, md: 5 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {concern.imageUrl ? (
                <Box
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <Box
                    component="img"
                    src={concern.imageUrl}
                    alt={concern.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              ) : (
                <Box
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <IconComponent size={80} color="rgba(255,255,255,0.9)" />
                </Box>
              )}
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* ── Overview Section ───────────────────────────────────── */}
      <Box py={{ base: 44, md: 64 }}>
        <Container size="xl">
          <SectionHeading
            eyebrow="Overview"
            title={`What Is ${concern.name}?`}
            text={content.overview}
          />
          <Paper
            radius={24}
            p={{ base: 'lg', md: 'xl' }}
            mt="lg"
            withBorder
            style={{
              borderColor: line,
              boxShadow: '0 18px 52px rgba(15, 23, 42, 0.06)',
            }}
          >
            <Text c={ink} lh={1.8} size="md">
              {content.overviewDetail}
            </Text>
          </Paper>
        </Container>
      </Box>

      {/* ── Symptoms Section ───────────────────────────────────── */}
      <Box py={{ base: 44, md: 64 }} style={{ background: soft }}>
        <Container size="xl">
          <SectionHeading
            eyebrow="Symptoms"
            title="Common Signs & Symptoms"
            text="Recognizing the symptoms early can help you seek timely treatment and prevent complications."
          />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mt="lg">
            {content.symptoms.map((symptom) => {
              const SymIcon = symptom.icon;
              return (
                <Paper
                  key={symptom.label}
                  className="lift-card"
                  radius={20}
                  p="lg"
                  withBorder
                  style={{
                    borderColor: line,
                    background: '#fff',
                    boxShadow: '0 12px 36px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <Group gap="md" wrap="nowrap" align="flex-start">
                    <ThemeIcon
                      radius="xl"
                      size={48}
                      style={{ background: 'rgba(22,163,74,0.1)', minWidth: 48 }}
                    >
                      <SymIcon size={22} color={green} />
                    </ThemeIcon>
                    <Stack gap={4}>
                      <Text fw={900} lh={1.3} style={{ color: ink }}>
                        {symptom.label}
                      </Text>
                      <Text size="sm" c={muted} lh={1.6}>
                        {symptom.description}
                      </Text>
                    </Stack>
                  </Group>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ── Prevention Section ─────────────────────────────────── */}
      <Box py={{ base: 44, md: 64 }}>
        <Container size="xl">
          <SectionHeading
            eyebrow="Prevention"
            title="How to Prevent & Manage"
            text="Take proactive steps to reduce your risk and manage the condition effectively."
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="lg">
            {content.prevention.map((tip) => {
              const TipIcon = tip.icon;
              return (
                <Paper
                  key={tip.title}
                  className="lift-card"
                  radius={20}
                  p="xl"
                  withBorder
                  style={{
                    borderColor: line,
                    background: '#fff',
                    boxShadow: '0 12px 36px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <Group gap="md" wrap="nowrap" align="flex-start">
                    <Box
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: 'rgba(22,163,74,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 56,
                      }}
                    >
                      <TipIcon size={26} color={green} />
                    </Box>
                    <Stack gap={4}>
                      <Text fw={900} size="lg" lh={1.3} style={{ color: ink }}>
                        {tip.title}
                      </Text>
                      <Text c={muted} lh={1.7}>
                        {tip.description}
                      </Text>
                    </Stack>
                  </Group>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ── Related Medicines ──────────────────────────────────── */}
      {products && products.length > 0 ? (
        <Box py={{ base: 44, md: 64 }} style={{ background: soft }}>
          <Container size="xl">
            <SectionHeading
              eyebrow="Medicines"
              title={`Recommended Medicines for ${concern.name}`}
              text="These products are commonly used to manage this health condition."
            />
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mt="lg">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </SimpleGrid>
            {products.length > 8 ? (
              <Group justify="center" mt="lg">
                <OutlineButton
                  leftSection={<ShoppingCartIcon />}
                  onClick={() => navigate({ to: '/shop/shop' })}
                >
                  View All Medicines
                </OutlineButton>
              </Group>
            ) : null}
          </Container>
        </Box>
      ) : null}

      {/* ── Related Articles ───────────────────────────────────── */}
      {articles && articles.length > 0 ? (
        <Box py={{ base: 44, md: 64 }}>
          <Container size="xl">
            <SectionHeading
              eyebrow="Articles"
              title="Related Health Articles"
              text="Learn more about managing this condition from our health blog."
            />
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mt="lg">
              {articles.slice(0, 6).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </SimpleGrid>
          </Container>
        </Box>
      ) : null}

      {/* ── Pharmacist Recommendation ──────────────────────────── */}
      <Box py={{ base: 44, md: 64 }} style={{ background: soft }}>
        <Container size="xl">
          <Paper
            radius={28}
            p={{ base: 'xl', md: 56 }}
            style={{
              background:
                'radial-gradient(circle at 20% 30%, rgba(22,163,74,0.22), transparent 40%), radial-gradient(circle at 80% 70%, rgba(14,165,233,0.15), transparent 35%), linear-gradient(135deg, #0F6F35 0%, #0D4D2B 50%, #0A3A1F 100%)',
              color: '#fff',
              boxShadow: '0 26px 70px rgba(15, 111, 53, 0.22)',
            }}
          >
            <Grid align="center" gap="xl">
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Stack gap="md">
                  <ThemeIcon radius="xl" size={54} style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <Stethoscope size={26} />
                  </ThemeIcon>
                  <Title order={2} className="damorex-heading" style={{ color: '#fff' }}>
                    Speak with a Damorex Pharmacist
                  </Title>
                  <Text maw={560} lh={1.7} style={{ color: 'rgba(255,255,255,0.82)' }}>
                    Our licensed pharmacists are available to answer your questions about{' '}
                    {concern.name.toLowerCase()}, recommend the right medications, and provide
                    personalized health advice from the comfort of your home.
                  </Text>
                  <Group gap={8}>
                    {['Free Advice', 'Private Consultation', 'Medication Review'].map((badge) => (
                      <Text
                        key={badge}
                        size="xs"
                        fw={800}
                        style={{
                          background: 'rgba(255,255,255,0.12)',
                          color: '#fff',
                          padding: '4px 14px',
                          borderRadius: 999,
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {badge}
                      </Text>
                    ))}
                  </Group>
                  <Group pt="sm">
                    <PrimaryButton
                      leftSection={<CalendarClock size={18} />}
                      onClick={() => navigate({ to: '/shop/consult-pharmacist' })}
                    >
                      Book Free Consultation
                    </PrimaryButton>
                    <Button
                      size="md"
                      radius="xl"
                      variant="outline"
                      leftSection={<MessageCircle size={18} />}
                      onClick={() => {
                        const url = `https://wa.me/${WEBSITE_PRESCRIPTION_PHONE.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${QUESTIONNAIRE_CODES.HEALTH_CONSULTATION}\r\nHello Damorex, I want to speak with a pharmacist about ${concern?.name || 'my health'}`)}`;
                        window.open(url, '_blank');
                      }}
                      style={{
                        borderColor: 'rgba(255,255,255,0.3)',
                        color: '#fff',
                        background: 'rgba(255,255,255,0.1)',
                      }}
                    >
                      Chat on WhatsApp
                    </Button>
                  </Group>
                </Stack>
              </Grid.Col>
              <Grid.Col
                span={{ base: 12, md: 5 }}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Box
                  style={{
                    width: 180,
                    height: 180,
                    borderRadius: 40,
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(255,255,255,0.12)',
                    transform: 'rotate(6deg)',
                  }}
                >
                  <MessageCircle size={72} color="rgba(255,255,255,0.7)" />
                </Box>
              </Grid.Col>
            </Grid>
          </Paper>
        </Container>
      </Box>

      {/* ── When to See a Doctor ───────────────────────────────── */}
      <Box py={{ base: 44, md: 64 }}>
        <Container size="xl">
          <SectionHeading
            eyebrow="Warning Signs"
            title="When to See a Doctor"
            text="Seek immediate medical attention if you or someone you know experiences any of the following."
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="lg">
            {content.warningSigns.map((warning) => {
              const WarnIcon = warning.icon;
              return (
                <Paper
                  key={warning.sign}
                  className="lift-card"
                  radius={16}
                  p="md"
                  withBorder
                  style={{
                    borderColor: '#FECACA',
                    background: '#FFF7F7',
                    boxShadow: '0 8px 24px rgba(239, 68, 68, 0.06)',
                  }}
                >
                  <Group gap="sm" wrap="nowrap">
                    <Box
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: 'rgba(239,68,68,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 40,
                      }}
                    >
                      <WarnIcon size={20} color="#EF4444" />
                    </Box>
                    <Text fw={800} size="sm" lh={1.4} style={{ color: '#7F1D1D' }}>
                      {warning.sign}
                    </Text>
                  </Group>
                </Paper>
              );
            })}
          </SimpleGrid>
        </Container>
      </Box>
    </WebsiteLayout>
  );
}

function ShoppingCartIcon() {
  const icon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
  return icon;
}

function ArticleCard({ article }: { article: BlogArticleView }) {
  const navigate = useNavigate();

  return (
    <Paper
      className="lift-card"
      radius={20}
      withBorder
      style={{
        borderColor: line,
        background: '#fff',
        boxShadow: '0 12px 36px rgba(15, 23, 42, 0.04)',
        cursor: 'pointer',
      }}
      onClick={() =>
        navigate({ to: `/damorex/blog/${article.slug}`, params: { slug: article.slug } })
      }
    >
      <Stack gap="md" p="lg">
        {article.imageUrl ? (
          <Box
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              height: 180,
              background: '#F1F8F4',
            }}
          >
            <Box
              component="img"
              src={article.imageUrl}
              alt={article.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Box>
        ) : (
          <Box
            style={{
              borderRadius: 14,
              height: 180,
              background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(14,165,233,0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HeartPulse size={40} color={line} />
          </Box>
        )}
        <Stack gap={6}>
          {article.readingTime ? (
            <Text size="xs" fw={800} c={green} tt="uppercase">
              {article.readingTime} min read
            </Text>
          ) : null}
          <Text fw={900} lh={1.3} style={{ color: ink }}>
            {article.title}
          </Text>
          {article.excerpt ? (
            <Text size="sm" c={muted} lh={1.6}>
              {article.excerpt.length > 120
                ? `${article.excerpt.slice(0, 120)}...`
                : article.excerpt}
            </Text>
          ) : null}
        </Stack>
        <Group gap={6} style={{ cursor: 'pointer' }}>
          <Text size="sm" fw={800} c={green}>
            Read Article
          </Text>
          <ArrowRightIcon color={green} />
        </Group>
      </Stack>
    </Paper>
  );
}
