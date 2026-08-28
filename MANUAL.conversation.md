# MANUAL — Conversation Engine

**Service:** `conversation-engine`
**Port:** 8090
**Part of:** RxSoft monorepo

---

## 1. What This Service Does

The Conversation Engine runs questionnaire-driven patient engagement conversations across multiple channels: SMS, WhatsApp, Email, and Telegram. It manages conversation lifecycles, processes answers, and integrates with workflows for automated follow-up actions.

---

## 2. Getting Started

### Prerequisites
- Node.js ≥22.22.0
- MongoDB with replica set (required for change streams)
- Docker (for local MongoDB)

### Install & Run

```bash
cd conversation
docker compose up -d      # Start MongoDB replica set
yarn install
npm run start:dev
```

The API starts on **http://localhost:8090**.
Swagger docs at **http://localhost:8090/api/docs**.

---

## 3. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | 8090 | Server port |
| `MONGODB_URI` | mongodb://admin:admin123@127.0.0.1:27017/conversation_engine_test?authSource=admin&directConnection=true | MongoDB connection string |
| `MONGODB_NAME` | conversation_engine_test | Database name |
| `DB_PREFIX` | dev | MongoDB collection prefix |
| `SEED_ON_STARTUP` | true | Seed questionnaires/workflows/channels on boot |
| `JWT_ACCESS_SECRET` | admin-access-secret | JWT secret for inter-service auth |

### Channel Credentials

| Variable | Description |
|---|---|
| `BULKSMS_USERNAME` | SMS channel username |
| `BULKSMS_PASSWORD` | SMS channel password |
| `BULKSMS_SENDER` | SMS sender name (default: `Healthstack`) |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business API phone ID |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp access token |
| `WHATSAPP_WEBHOOK_TOKEN` | WhatsApp webhook verification token |
| `SMTP_HOST` | Email SMTP host |
| `SMTP_PORT` | SMTP port (default: 465) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_SENDER` | From address for emails |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_WEBHOOK_URL` | Public webhook URL for Telegram |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram webhook secret |

### Channel IDs

| Variable | Description |
|---|---|
| `CHANNEL_ID_MOCK` | Mock channel (testing) |
| `CHANNEL_ID_SMS_NBSMS` | SMS channel ID |
| `CHANNEL_ID_EMAIL` | Email channel ID |
| `CHANNEL_ID_WHATSAPP` | WhatsApp channel ID |
| `CHANNEL_ID_TELEGRAM` | Telegram channel ID |

### Integration

| Variable | Description |
|---|---|
| `HS_BACKEND_BASE_URL` | Healthstack backend URL |
| `HS_BACKEND_USERNAME` | Backend API username |
| `HS_BACKEND_PASSWORD` | Backend API password |
| `QUESTIONNAIRE_GOOGLE_SHEET_ID` | Google Sheet ID for questionnaire imports |
| `QUESTIONNAIRE_GOOGLE_CLIENT_EMAIL` | Service account email |
| `QUESTIONNAIRE_GOOGLE_PRIVATE_KEY` | Service account private key |

---

## 4. Architecture

### Domain Modules

| Module | Purpose |
|---|---|
| `conversation` | Lifecycle management, participant lookup, answer processing |
| `questionnaire` | Questionnaire definitions, questions, option lists |
| `channels` | Channel abstractions, senders, processors, webhooks |
| `workflow` | Workflow definitions, instances, transitions, actions |
| `shared` | Domain types, enums, converters |
| `scripts` | Seeding and startup sync |

### Code Structure

```
src/
├── modules/
│   ├── conversation/    # Lifecycle, participant lookup, answer processing
│   ├── questionnaire/   # Definitions, questions, option lists
│   ├── channels/        # Senders, processors, webhook endpoints
│   ├── workflow/         # Definitions, instances, event bus, transitions
│   └── shared/          # Types, enums, converters
└── scripts/             # Seeding and sync scripts
```

---

## 5. End-to-End Flow

```
1. Inbound message arrives (SMS/WhatsApp/Email/Telegram webhook)
   │
   ▼
2. ConversationService.processInboundMessageFromPhoneNumber()
   │  → Lookup participant by phone (create if new)
   │  → Resolve active conversation or create from questionnaire
   │
   ▼
3. Workflow instance created (if questionnaire has workflowId)
   │
   ▼
4. Channel sender resolved → question rendered → sent
   │
   ▼
5. User responds → QuestionProcessorService.processAnswer()
   │  → Invalid? Resend with error message
   │  → Valid? Advance to next question or complete
   │
   ▼
6. Events emitted via EventBusService
   │  CONVERSATION_STARTED, ANSWER_VALID, ANSWER_INVALID,
   │  CONVERSATION_COMPLETED, CONVERSATION_STOPPED
   │
   ▼
7. Workflow transitions evaluated → actions executed (e.g., HTTP_POST)
```

---

## 6. API Reference

### 6.1 Webhook Endpoints (Inbound)

| Channel | Webhook Path |
|---|---|
| WhatsApp | `POST /api/webhooks/whatsapp` |
| SMS | `POST /api/webhooks/sms` |
| Telegram | `POST /api/webhooks/telegram` |
| Email | `POST /api/webhooks/email` |

### 6.2 Conversations

| Operation | Method | Endpoint |
|---|---|---|
| Get conversation by ID | `GET` | `/api/conversations/:id` |
| List conversations | `GET` | `/api/conversations?participantId=&status=` |
| Stop conversation | `POST` | `/api/conversations/:id/stop` |

### 6.3 Questionnaires

| Operation | Method | Endpoint |
|---|---|---|
| Create questionnaire | `POST` | `/api/questionnaires` |
| List questionnaires | `GET` | `/api/questionnaires` |
| Get questionnaire by ID | `GET` | `/api/questionnaires/:id` |
| Update questionnaire | `PATCH` | `/api/questionnaires/:id` |

### 6.4 Questions

| Operation | Method | Endpoint |
|---|---|---|
| Get questions for questionnaire | `GET` | `/api/questionnaires/:id/questions` |
| Create question | `POST` | `/api/questions` |
| Update question | `PATCH` | `/api/questions/:id` |

### 6.5 Workflows

| Operation | Method | Endpoint |
|---|---|---|
| Create workflow definition | `POST` | `/api/workflows` |
| List workflow definitions | `GET` | `/api/workflows` |
| Get workflow instance | `GET` | `/api/workflows/instances/:id` |
| Trigger workflow action | `POST` | `/api/workflows/instances/:id/trigger` |

### 6.6 Channels

| Operation | Method | Endpoint |
|---|---|---|
| List configured channels | `GET` | `/api/channels` |
| Get channel by ID | `GET` | `/api/channels/:id` |

---

## 7. Supported Channels

| Channel | Sender | Webhook | Notes |
|---|---|---|---|
| **SMS** | BulkSMS / NBSMS | `POST /api/webhooks/sms` | Requires BulkSMS credentials |
| **WhatsApp** | WhatsApp Business API | `POST /api/webhooks/whatsapp` | Requires Meta Business account |
| **Email** | SMTP (via @nestjs-modules/mailer) | `POST /api/webhooks/email` | Any SMTP provider |
| **Telegram** | Telegram Bot API | `POST /api/webhooks/telegram` | Requires bot token + public webhook URL |

---

## 8. Questionnaire Seed Data

### From Google Sheets
```bash
# Set env vars
QUESTIONNAIRE_GOOGLE_SHEET_ID=...
QUESTIONNAIRE_GOOGLE_CLIENT_EMAIL=...
QUESTIONNAIRE_GOOGLE_PRIVATE_KEY=...

# Run seed
npm run seed:questionnaires
```

### Manual Seed
```bash
# Seed on startup
SEED_ON_STARTUP=true npm run start:dev
```

### Repair Question IDs
```bash
npm run repair:question-ids
```

---

## 9. Database

- **Type:** MongoDB with replica set (required for change streams)
- **ODM:** Mongoose 9
- **Collection prefixing:** `DB_PREFIX` env var (default: `dev`)

### Local Development

```bash
docker compose up -d    # Starts MongoDB with replica set
```

### Testing

Uses `mongodb-memory-server` (in devDependencies) for isolated test databases.

---

## 10. Commands

```bash
npm run start:dev            # Dev server with watch
npm run build                # Compile TypeScript
npm run start:prod           # Production (with --max-old-space-size=4096)
npm run test                 # Unit tests
npm run test:e2e             # End-to-end tests (--runInBand)
npm run seed:questionnaires  # Seed questionnaire data
npm run repair:question-ids  # Repair question ID references

# Run a single e2e test
npx jest --config ./test/jest-e2e.json --runInBand \
  test/modules/conversation/workflow-submission.e2e-spec.ts
```

---

## 11. Troubleshooting

| Issue | Solution |
|---|---|
| MongoDB connection failed | Ensure `docker compose up -d` started the replica set |
| Change stream errors | MongoDB must run as a replica set, not standalone |
| WhatsApp webhook not received | Verify `WHATSAPP_WEBHOOK_TOKEN` and public URL |
| Telegram webhook not set | Use `TELEGRAM_WEBHOOK_URL` with a valid public domain |
| Seed data missing | Set `SEED_ON_STARTUP=true` or run `seed:questionnaires` |
| Memory issues in prod | Production uses `--max-old-space-size=4096` |

---

## 12. Related Documentation

- [PRD.md](./PRD.md) — Full product requirements
- [sequencediagram.md](../conversation/sequencediagram.md) — Full sequence diagrams
- [sequencediagram.compact.md](../conversation/sequencediagram.compact.md) — Compact sequence diagrams
- [AGENTS.md](../AGENTS.md) — Monorepo overview
