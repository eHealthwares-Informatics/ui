import type { WebsiteProduct, CartItem } from './types';

export const QUESTIONNAIRE_CODES = {
  PRODUCT_INQUIRY: 'PRODUCT_INQUIRY',
  PHARMACY_ORDER: 'PHARMACY_ORDER',
  HEALTH_CONSULTATION: 'HEALTH_CONSULTATION',
  GENERAL_INQUIRY: 'GENERAL_INQUIRY',
} as const;

export type QuestionnaireCode = (typeof QUESTIONNAIRE_CODES)[keyof typeof QUESTIONNAIRE_CODES];

interface ItemDescriptor {
  code: string;
  name: string;
  strength?: string | null;
  dosageForm?: string | null;
  quantity: number;
}

function nowHL7(): string {
  const d = new Date();
  return d.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
}

function msgId(): string {
  return `ORD${Date.now()}`;
}

export function toHL7Prescription(
  input: CartItem[] | { product: WebsiteProduct; quantity: number },
  options?: {
    questionnaireCode?: QuestionnaireCode;
    customerName?: string;
    customerPhone?: string;
    orderRef?: string;
  },
): string {
  const items: ItemDescriptor[] = [];

  if (Array.isArray(input)) {
    for (const ci of input) {
      const p = ci.product;
      if (!p) {continue;}
      items.push({
        code: p.code,
        name: p.name,
        strength: p.genericProduct?.strength,
        dosageForm: p.genericProduct?.dosageForm,
        quantity: ci.quantity,
      });
    }
  } else {
    const p = input.product;
    items.push({
      code: p.code,
      name: p.name,
      strength: p.genericProduct?.strength,
      dosageForm: p.genericProduct?.dosageForm,
      quantity: input.quantity,
    });
  }

  if (!items.length) {return '';}

  const orderRef = options?.orderRef ?? msgId();
  const patientId = options?.customerPhone ?? 'UNKNOWN';
  const patientName = options?.customerName ?? 'Customer';
  const patientPhone = options?.customerPhone ?? '';

  const dateTime = nowHL7();
  const id = msgId();
  const sender = 'DAMOREX';
  const receiver = 'PHARMACY';
  const app = 'WEBSITE';
  const facility = 'ONLINE';

  const segments: string[] = [];

  // MSH
  segments.push(
    `MSH|^~\\&|${sender}|${facility}|${receiver}|${app}|${dateTime}||ORM^O01|${id}|P|2.5`,
  );

  // PID
  segments.push(
    `PID|1||${patientId}||${patientName}|||M|||${patientPhone}`,
  );

  // ORC
  segments.push(`ORC|NW|${orderRef}`);

  // RXE + RXR per item
  for (const item of items) {
    const strength = item.strength ?? '';
    const form = item.dosageForm ?? 'TAB';
    const route = form.toLowerCase().includes('inj') || form.toLowerCase().includes('iv')
      ? 'IV'
      : form.toLowerCase().includes('top') || form.toLowerCase().includes('cream')
        ? 'TOPICAL'
        : 'ORAL';
    segments.push(
      `RXE|1|${item.code}^${item.name}^NDC|${strength}|${form}|||||${item.quantity}|PRN||1|${form}`,
    );
    segments.push(`RXR|${route}`);
  }

  return segments.join('\r\n');
}

export function buildWhatsAppUrl(
  hl7Text: string,
  phone: string,
  questionnaireCode: QuestionnaireCode,
): string {
  const prefix = `${questionnaireCode}`;
  const full = `${prefix}\r\nWEBSITE_PRESCRIPTION\r\n${hl7Text}`;
  return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(full)}`;
}

export const WEBSITE_PRESCRIPTION_PHONE = '+2348022224166';
