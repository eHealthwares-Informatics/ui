import type { EntityInfo } from '@/features/components/page/info-drawer';

export const entityInfoMap: Record<string, EntityInfo> = {
  'test-definitions': {
    title: 'Test Definitions',
    description: 'A specific laboratory analysis that can be ordered, performed on a sample, and reported. Each Test has a name, method, unit of measure, test section assignment, LOINC code, and configurable normal/reporting/critical ranges.',
    openelisTable: 'TEST',
    fields: [
      { name: 'code', description: 'Unique internal code for the test' },
      { name: 'testSectionId', description: 'Department or functional area grouping (e.g. Hematology, Biochemistry)' },
      { name: 'methodId', description: 'Scientific technique used (e.g. ELISA, PCR, Colorimetric)' },
      { name: 'unitId', description: 'Measurement unit for quantitative results (e.g. mg/dL, cells/uL)' },
      { name: 'loincIds', description: 'Standard LOINC codes for interoperability with external systems' },
    ],
  },
  'reference-ranges': {
    title: 'Reference Ranges',
    description: 'Normal, critical, and valid ranges for test results, configurable by age range, gender, and test. These ranges determine whether a patient result falls within expected normal limits or triggers a critical alert.',
    openelisTable: 'RESULT_LIMITS',
    fields: [
      { name: 'testDefinitionId', description: 'The test this range applies to' },
      { name: 'gender', description: 'Gender specificity (M, F, or U for universal)' },
      { name: 'minAge / maxAge', description: 'Age range in days this reference range applies to' },
      { name: 'lowNormal / highNormal', description: 'Normal expected range boundaries' },
      { name: 'lowCritical / highCritical', description: 'Critical panic value thresholds' },
    ],
  },
  'rejection-reasons': {
    title: 'Rejection Reasons',
    description: 'Coded reasons explaining why a sample or test result was rejected. Common reasons include hemolysis, insufficient quantity, clotted specimen, or labeling errors.',
    openelisTable: 'DICTIONARY (REJECTION_REASON category)',
  },
  programs: {
    title: 'Programs',
    description: 'Health programs (e.g. HIV, TB, Malaria) that have specific testing requirements, questionnaires, and reporting protocols. Programs can be linked to test sections and used to filter the test catalog.',
    openelisTable: 'PROGRAM',
  },
  'location-types': {
    title: 'Location Types',
    description: 'Classifications within the physical storage hierarchy for specimens and supplies. Examples: Room, Freezer, Shelf, Rack, Box. Each type defines which child types it can contain.',
    openelisTable: 'STORAGE (Location Type)',
  },
  locations: {
    title: 'Locations',
    description: 'Physical storage locations organized in a hierarchical structure — Room → Device (freezer/refrigerator) → Rack → Shelf → Box. Each level supports barcode tracking.',
    openelisTable: 'STORAGE_ROOM / STORAGE_DEVICE / STORAGE_RACK / STORAGE_SHELF / STORAGE_BOX',
    fields: [
      { name: 'typeId', description: 'What kind of location this is (Room, Freezer, Shelf, etc.)' },
      { name: 'parentId', description: 'Parent location in the hierarchy (e.g. a Freezer belongs to a Room)' },
    ],
  },
  'attribute-definitions': {
    title: 'Attribute Definitions',
    description: 'Configurable metadata fields that can be attached to storage locations for tracking additional properties such as temperature thresholds, serial ports, or networking configuration.',
    openelisTable: 'STORAGE (custom attributes)',
    fields: [
      { name: 'dataType', description: 'Type of value stored: TEXT, NUMBER, DATE, BOOLEAN, or SELECT' },
      { name: 'options', description: 'For SELECT type, a JSON array of allowed values' },
    ],
  },
  'sample-types': {
    title: 'Sample Types',
    description: 'Catalog of specimen types the lab can accept, such as Whole Blood, Serum, Plasma, Urine, or Saliva. Each type has an accession code fragment used in barcode generation.',
    openelisTable: 'TYPE_OF_SAMPLE',
    fields: [
      { name: 'key', description: 'Short identifier key used in accession number generation' },
      { name: 'accessionCode', description: 'Abbreviation (max 3 chars) embedded in sample barcodes' },
    ],
  },
  priorities: {
    title: 'Priorities',
    description: 'Urgency levels assigned to lab orders: Routine, Urgent, or STAT. STAT orders are flagged for immediate processing with overdue tracking.',
    openelisTable: 'ORDER_PRIORITY (enum)',
    fields: [
      { name: 'index', description: 'Sort order — higher index = higher urgency' },
    ],
  },
  'test-categories': {
    title: 'Test Categories',
    description: 'Top-level groupings used to classify tests and organize the test catalog. Examples include Hematology, Clinical Chemistry, Microbiology, and Serology.',
    openelisTable: 'TEST (category via hibernate mapping)',
  },
  uoms: {
    title: 'Units of Measurement',
    description: 'Measurement units used to report quantitative test results, such as mg/dL, cells/uL, IU/mL. Units are assigned to tests and reference ranges.',
    openelisTable: 'UNIT_OF_MEASURE',
  },
  loinc: {
    title: 'LOINC Codes',
    description: 'Standard codes from the LOINC vocabulary mapped to tests for interoperability. Enables electronic ordering and result reporting with external systems using universal laboratory observation identifiers.',
    openelisTable: 'LOINC (seeded reference table)',
    fields: [
      { name: 'code', description: 'LOINC code (e.g. 718-7 for Hemoglobin)' },
      { name: 'component', description: 'The analyte or substance being measured' },
      { name: 'property', description: 'Characteristic being measured (MCnc = Mass Concentration)' },
      { name: 'scale', description: 'Scale of measurement (Qn = Quantitative, Ord = Ordinal)' },
    ],
  },
  'test-sections': {
    title: 'Test Sections',
    description: 'Departments or functional areas within the lab that group related tests. Examples: Hematology, Biochemistry, Molecular Biology. Used to organize the test catalog and route work.',
    openelisTable: 'TEST_SECTION',
  },
  methods: {
    title: 'Methods',
    description: 'Scientific techniques or technologies used to perform tests (e.g. ELISA, PCR, Colorimetric). Each test is associated with a method that may appear on result certificates.',
    openelisTable: 'METHOD',
  },
  panels: {
    title: 'Panels',
    description: 'Predefined groups of tests commonly ordered together as a single unit (e.g. Complete Blood Count containing Hemoglobin, WBC, Platelets). Panels can be assigned to specific sample types.',
    openelisTable: 'PANEL / PANEL_ITEM',
    fields: [
      { name: 'testIds', description: 'Tests included in this panel' },
    ],
  },
  patients: {
    title: 'Patients',
    description: 'Patients derived from lab order records. Patient demographics are embedded directly in each order — this view provides a read-only lookup of unique patients across all orders.',
    openelisTable: 'PATIENT / PERSON / SAMPLE_HUMAN',
  },
  orders: {
    title: 'Orders',
    description: 'Lab orders that capture a request for testing on a patient specimen. Each order links the patient, tests ordered, priority, and tracks the specimen through accessioning, testing, validation, and reporting.',
    openelisTable: 'SAMPLE / ELECTRONIC_ORDER / SAMPLE_HUMAN',
    fields: [
      { name: 'orderNumber', description: 'Unique accession number for the order' },
      { name: 'status', description: 'Current workflow status: ENTERED → IN_PROGRESS → COMPLETED / CANCELLED' },
      { name: 'patientId', description: 'Medical record number for the patient' },
    ],
  },
  results: {
    title: 'Results',
    description: 'Individual test result values produced by analyzing a sample. Each result records the numeric or coded value, unit, normal range comparison, and links back to the order item.',
    openelisTable: 'RESULT',
    fields: [
      { name: 'orderItemId', description: 'The order item this result belongs to (read-only, set from order context)' },
      { name: 'value', description: 'The result value — numeric or coded text' },
      { name: 'status', description: 'Validation status: PENDING → TECHNICAL_REVIEW → FINALIZED / CANCELLED' },
    ],
  },
  'result-signatures': {
    title: 'Result Signatures',
    description: 'Audit records documenting who signed off on a test result and whether they approved as a supervisor. Forms the two-level approval chain (technical + supervisory) required for result validation and release.',
    openelisTable: 'RESULT_SIGNATURE',
    fields: [
      { name: 'isSupervisor', description: 'Whether this signature is a supervisory (second-level) approval' },
    ],
  },
  samples: {
    title: 'Samples',
    description: 'Physical specimens collected from patients for laboratory testing. Each sample has a unique barcode, tracks collection/received dates, and links to the parent order.',
    openelisTable: 'SAMPLE / SAMPLE_ITEM',
    fields: [
      { name: 'barcode', description: 'Unique barcode identifier for the physical specimen' },
      { name: 'orderId', description: 'The lab order this sample belongs to' },
      { name: 'status', description: 'COLLECTED → RECEIVED → IN_PROGRESS → DISPOSED / REJECTED' },
    ],
  },
  statuses: {
    title: 'Statuses',
    description: 'Database-driven workflow statuses for orders, samples, and results. Each status belongs to a domain (ORDER, SAMPLE, RESULT) and enforces forward-only progression with cancel-to-any support.',
    openelisTable: 'STATUS_OF_SAMPLE',
    fields: [
      { name: 'domain', description: 'Which entity type this status applies to: ORDER, SAMPLE, or RESULT' },
      { name: 'sortOrder', description: 'Sequence position — statuses progress from low to high order' },
    ],
  },
  'validation-dashboard': {
    title: 'Validation Dashboard',
    description: 'Centralized view of all test results grouped by validation status. Review and approve results through the PENDING → TECHNICAL_REVIEW → FINALIZED workflow, with signature enforcement at each step.',
  },
  'qc-lots': {
    title: 'QC Lots',
    description: 'Quality control materials tracked by lot number, manufacturer, and expiry. Each lot stores configuration for target mean and standard deviation per test — used as the basis for Westgard rule evaluation when entering QC results.',
    openelisTable: 'QCT_LOT / QCT_LOT_TEST',
    fields: [
      { name: 'testConfig', description: 'JSON configuration of target mean and SD for each test on this lot' },
    ],
  },
  'qc-results': {
    title: 'QC Results',
    description: 'Individual quality control measurements entered against a lot and test. When a result is saved, the system automatically evaluates all six Westgard rules against historical values for this lot/test combination.',
    openelisTable: 'QCT_SAMPLE (per-test QC result)',
    fields: [
      { name: 'qcLotId', description: 'The control material lot being tested' },
      { name: 'testDefinitionId', description: 'Which test was run on the control material' },
      { name: 'value', description: 'Measured value — compared against the lot target mean/SD' },
      { name: 'inControl', description: 'Automatically set based on Westgard evaluation' },
    ],
  },
  'eqa-programs': {
    title: 'EQA Programs',
    description: 'External Quality Assessment (EQA) programs that the laboratory participates in to validate testing accuracy. Programs like CAP, RIQAS, and NEQAS periodically send unknown samples for testing and compare results across laboratories.',
    openelisTable: 'EQA_PROGRAM',
    fields: [
      { name: 'code', description: 'Short identifier (e.g. CAP, RIQAS)' },
    ],
  },
  'eqa-enrollments': {
    title: 'EQA Enrollments',
    description: 'Links a specific test to an EQA program round for a participation period. Tracks the full lifecycle: ENROLLED → SAMPLES_RECEIVED → RESULTS_SUBMITTED → EVALUATED.',
    openelisTable: 'EQA_USE / EQA_USE_TEST',
    fields: [
      { name: 'programId', description: 'The EQA program' },
      { name: 'testDefinitionId', description: 'The test being enrolled' },
      { name: 'roundLabel', description: 'The round/period identifier (e.g. 2025-A)' },
      { name: 'status', description: 'Current lifecycle stage of enrollment' },
    ],
  },
  'eqa-results': {
    title: 'EQA Results',
    description: 'Individual sample results submitted for an EQA program round. After submission, the program evaluates performance — providing expected values, z-scores, and pass/fail assessments.',
    openelisTable: 'EQA_RESULT / EQA_RETURN_ITEM',
    fields: [
      { name: 'sampleNumber', description: 'Sample identifier assigned by the EQA provider' },
      { name: 'value', description: 'Result value submitted by the lab' },
      { name: 'zScore', description: 'Normalized deviation from the peer group mean' },
      { name: 'evaluation', description: 'PASS, FAIL, or WARNING based on program criteria' },
    ],
  },
  'qc-alerts': {
    title: 'QC Alerts',
    description: 'Alerts automatically created when a QC result violates one or more Westgard rules. WARNING-level alerts (1-2s) require attention; REJECT-level alerts indicate the run is out of control and results should not be reported.',
    openelisTable: 'QCT_SAMPLE (alert flags)',
    fields: [
      { name: 'rule', description: 'Westgard rule violated: 1-2s, 1-3s, 2-2s, R-4s, 4-1s, or 10x' },
      { name: 'severity', description: 'WARNING (1-2s) or REJECT (all other rules)' },
      { name: 'active', description: 'Whether this alert is still unresolved' },
    ],
  },
};
