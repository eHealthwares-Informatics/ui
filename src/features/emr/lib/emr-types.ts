export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'MISSED';

export type AppointmentType =
  | 'CHECKUP'
  | 'FOLLOW_UP'
  | 'CONSULTATION'
  | 'PROCEDURE'
  | 'EMERGENCY'
  | 'SURGERY'
  | 'OTHER';

export type Priority = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export type Appointment = {
  id: string;
  organizationId: string | null;
  locationId: string | null;
  appointmentNumber: string;
  patientId: string;
  patientName: string;
  appointmentType: AppointmentType;
  date: string;
  startTime: string;
  endTime: string | null;
  providerId: string | null;
  providerName: string | null;
  status: AppointmentStatus;
  priority: Priority;
  reason: string | null;
  notes: string | null;
  scheduleLocation: string | null;
  visitId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardMetrics = {
  totalAppointments: number;
  checkedIn: number;
  inProgress: number;
  completed: number;
  scheduled: number;
  cancelled: number;
  noShow: number;
  providersOnDuty: number;
  averageWaitMinutes: number;
};

export type ProviderLoadEntry = {
  providerId: string;
  providerName: string;
  patientCount: number;
};

export type DashboardSummary = {
  date: string;
  metrics: DashboardMetrics;
  appointments: Appointment[];
  providerLoad: ProviderLoadEntry[];
  upcoming: Appointment[];
};

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'checkbox-group'
  | 'table'
  | 'section'
  | 'tab'
  | 'col'
  | 'item';

export type FormFieldSchema = {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: unknown;
  rows?: number;
  columns?: { key: string; label: string; type: FormFieldType }[];
  /** Child fields — only used by the 'tab' container type. */
  fields?: FormFieldSchema[];
};

export type FormSchema = {
  fields: FormFieldSchema[];
};

export type FormDefinition = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  version: number;
  category: string;
  schemaJson: FormSchema;
  isPublished: boolean;
  publishedVersion: number | null;
  isActive: boolean;
};

export type FormSubmission = {
  id: string;
  submissionNumber: string;
  formDefinitionId: string;
  formName: string;
  formVersion: number;
  patientId: string;
  visitId: string | null;
  encounterId: string | null;
  dataJson: Record<string, unknown>;
  status: 'DRAFT' | 'SUBMITTED' | 'AMENDED';
  submittedById: string | null;
  submittedByName: string | null;
  submittedAt: string | null;
  amendedFromId: string | null;
  /** True when the submission was filled against an older published schema. */
  schemaOutdated?: boolean;
  /** Published schema version of the form definition right now. */
  schemaCurrentVersion?: number | null;
};

export type Visit = {
  id: string;
  visitNumber: string;
  patientId: string;
  patientName: string;
  visitType: string;
  status: 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  startDatetime: string;
  stopDatetime: string | null;
  providerId: string | null;
  providerName: string | null;
  appointmentId: string | null;
};

export type Encounter = {
  id: string;
  encounterNumber: string;
  patientId: string;
  patientName: string | null;
  visitId: string | null;
  encounterType: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | string;
  providerId: string | null;
  providerName: string | null;
  encounterDatetime: string;
  endedAt?: string | null;
  reason: string | null;
  notes: string | null;
};

export type RequestItem = {
  id: string;
  requestId: string;
  name: string;
  code: string | null;
  dose: string | null;
  doseUnit: string | null;
  frequency: string | null;
  route: string | null;
  duration: string | null;
  durationUnit: string | null;
  quantity: number | null;
  instructions: string | null;
  sampleType: string | null;
  specimenNotes: string | null;
  modality: string | null;
  bodyPart: string | null;
  contrast: boolean;
  clinicalIndication: string | null;
  category: string | null;
  notes: string | null;
};

export type RequestStatus = 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

export type RequestStatusHistory = {
  id: string;
  requestId: string;
  fromStatus: string | null;
  toStatus: RequestStatus | null;
  reason: string | null;
  actorUserId: string | null;
  actorUsername: string | null;
  createdAt: string;
};

export type RequestDetail = {
  id: string;
  requestNumber: string;
  patientId: string;
  patientName: string | null;
  encounterId: string | null;
  visitId: string | null;
  requestType: string;
  status: RequestStatus;
  priority: string;
  orderingProviderId: string | null;
  orderingProviderName: string | null;
  diagnosis: string | null;
  clinicalNotes: string | null;
  externalOrderId: string | null;
  externalReference: string | null;
  syncStatus: string;
  syncError: string | null;
  sendAttemptCount: number;
  sentAt: string | null;
  lastSyncedAt: string | null;
  requestedAt: string;
  completedAt: string | null;
  items: RequestItem[];
  statusHistory: RequestStatusHistory[];
};

export type StaffRoleType = 'Doctor' | 'Nurse' | 'Technician' | 'Therapist' | 'Admin' | 'Support';

export type StaffCategory =
  | 'Medical'
  | 'Nursing'
  | 'Allied Health'
  | 'Pharmacy'
  | 'Laboratory'
  | 'Administrative'
  | 'Support'
  | 'Other';

export type Staff = {
  id: string;
  staffNumber: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  email: string | null;
  phone: string | null;
  hireDate: string | null;
  roleType: StaffRoleType;
  category: StaffCategory | null;
  department: string | null;
  departmentId: string | null;
  identityLocationId: string | null;
  userId: string | null;
  isActive: boolean;
  otherDetails: Record<string, unknown> | null;
};

export type DepartmentType =
  | 'OPD'
  | 'INPATIENT'
  | 'EMERGENCY'
  | 'LABORATORY'
  | 'PHARMACY'
  | 'RADIOLOGY'
  | 'MATERNITY'
  | 'SUPPORT'
  | 'OTHER';

export type Department = {
  id: string;
  organizationId: string | null;
  locationId: string | null;
  code: string;
  name: string;
  departmentType: DepartmentType;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PatientDetail = {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  nextOfKinName: string | null;
  nextOfKinPhone: string | null;
  nextOfKinRelationship: string | null;
  maritalStatus: string | null;
  occupation: string | null;
  bloodGroup: string | null;
  genotype: string | null;
  identifiers: Array<{ type: string; value: string }>;
  paymentProviderIds: string[];
  isActive: boolean;
};

export type PaymentProviderType = 'CASH' | 'HMO' | 'COMPANY' | 'PROGRAM' | 'OTHER';

export type PaymentProvider = {
  id: string;
  code: string;
  name: string;
  type: PaymentProviderType;
  description: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  isActive: boolean;
  organizationId: string | null;
  locationId: string | null;
};

export type WardType =
  | 'GENERAL'
  | 'PRIVATE'
  | 'ICU'
  | 'PEDIATRIC'
  | 'MATERNITY'
  | 'ISOLATION'
  | 'EMERGENCY'
  | 'OTHER';

export type Ward = {
  id: string;
  organizationId: string | null;
  locationId: string | null;
  code: string;
  name: string;
  wardType: WardType;
  departmentId: string | null;
  departmentType: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BedType = 'STANDARD' | 'ICU' | 'MATERNITY' | 'ISOLATION' | 'PEDIATRIC' | 'RECOVERY';

export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export type Bed = {
  id: string;
  organizationId: string | null;
  locationId: string | null;
  wardId: string;
  code: string;
  bedType: BedType;
  status: BedStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdmissionStatus = 'ADMITTED' | 'TRANSFERRED' | 'DISCHARGED';

export type AdmissionType =
  | 'EMERGENCY'
  | 'URGENT'
  | 'ELECTIVE'
  | 'MATERNITY'
  | 'SURGICAL'
  | 'MEDICAL';

export type DischargeType =
  | 'DISCHARGED_HOME'
  | 'DIED'
  | 'REFERRED'
  | 'TRANSFERRED'
  | 'SELF_DISCHARGE'
  | 'AMA';

export type Admission = {
  id: string;
  admissionNumber: string;
  patientId: string;
  patientName: string;
  wardId: string | null;
  bedId: string | null;
  admissionDatetime: string;
  admissionType: AdmissionType;
  diagnosis: string | null;
  referringProviderId: string | null;
  referringProviderName: string | null;
  status: AdmissionStatus;
  dischargeDatetime: string | null;
  dischargeType: DischargeType | null;
  dischargeSummary: string | null;
  notes: string | null;
  /** Admissions extend a visit — encounters/requests attach via this visit. */
  visitId?: string | null;
  visit?: {
    id: string;
    visitNumber: string;
    visitType: string;
    status: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};
