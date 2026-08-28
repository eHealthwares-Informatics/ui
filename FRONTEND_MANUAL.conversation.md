# FRONTEND MANUAL — Conversation Engine

**Frontend routes:** `/conversation/*`
**Backend:** `conversation-engine` (port 8090)

---

## 1. What You Can Do

The Conversation module provides a full interface for managing multi-channel patient engagement: creating and monitoring questionnaire-driven conversations, managing participants, configuring channels (SMS, WhatsApp, Email, Telegram), building workflows, and reviewing message exchanges in real-time.

---

## 2. Navigation

```
Sidebar → Conversation
  ├── Chats (Live Conversations)
  ├── Questionnaires
  ├── Questions
  ├── Option Lists
  ├── Channels
  ├── Participants
  ├── Broadcasts
  ├── Exchanges (Message History)
  ├── Workflows
  ├── Workflow Configuration
  ├── Workflow Instances
  ├── Workflow Events
  └── Projections
```

---

## 3. Chats (Live Conversations)

**Route:** `/conversation/chats`

The primary view for monitoring and participating in active conversations.

### Chat List

Shows all active and recent conversations with:
- **Participant** — Phone number and name (if known)
- **Channel** — SMS, WhatsApp, Email, or Telegram icon
- **Questionnaire** — Which questionnaire is being used
- **Status** — Active, Completed, Stopped
- **Last message** — Preview of the latest exchange
- **Timestamp** — When the last message was received/sent

### Chat Detail

**Route:** `/conversation/chats/:conversationId`

A real-time conversation view showing:

#### Message Thread
- **Inbound messages** (from patient) — Left-aligned, different color
- **Outbound messages** (from system) — Right-aligned
- **System events** — Center-aligned, muted (e.g., "Conversation started", "Question answered")

#### Participant Info Panel
- Phone number
- Participant ID
- Registration date
- Active conversations count

#### Actions
- **Stop Conversation** — End the current conversation
- **Send Manual Message** — Override the questionnaire flow with a custom message
- **View History** — See all exchanges for this participant

---

## 4. Questionnaires

**Route:** `/conversation/questionnaires`

Questionnaire definitions control what questions are asked and how the conversation flows.

### Listing Questionnaires

**Columns:** Name, Code, Description, Workflow, Status, Questions Count

**Search:** Filter by name or code

### Creating a Questionnaire

1. Click **Add Questionnaire**
2. Fill in:
   - **Name** (required) — Display name
   - **Code** (required) — Unique identifier
   - **Description** — What this questionnaire is for
   - **Workflow** (optional) — Link to a workflow definition
   - **Channel** (select) — Default channel for this questionnaire
3. Click **Create**

### Editing a Questionnaire

1. Click the questionnaire row
2. Modify fields
3. Click **Save**

### Linking to Workflows

If a questionnaire has a `workflowId`:
1. When a conversation starts from this questionnaire, a **workflow instance** is automatically created
2. Conversation events (started, answer valid, completed) trigger workflow transitions
3. Workflow actions (e.g., HTTP_POST) execute with aggregated conversation data

---

## 5. Questions

**Route:** `/conversation/questions`

Individual questions within questionnaires.

### Listing Questions

**Columns:** Questionnaire, Text, Type, Options, Sort Order, Required

### Creating a Question

1. Click **Add Question**
2. Fill in:
   - **Questionnaire** (select)
   - **Question Text** (required) — What to ask
   - **Question Type** (select):
     - `text` — Free-text response
     - `number` — Numeric response
     - `single_choice` — One option from a list
     - `multiple_choice` — Multiple options
     - `date` — Date response
     - `yes_no` — Boolean
   - **Options** (for choice types) — Link to an option list
   - **Sort Order** — Position in the questionnaire
   - **Required** — Whether the question must be answered
   - **Validation Rules** — Optional regex or range validation
   - **Error Message** — Custom message for invalid responses
3. Click **Create**

### Question Processing

The conversation engine processes answers as follows:
1. **Answer received** → Validate against question type and rules
2. **Invalid** → Resend the question with the error message
3. **Valid** → Store the answer and advance to the next question
4. **Last question** → Complete the conversation

---

## 6. Option Lists

**Route:** `/conversation/option-lists`

Reusable lists of options for choice-type questions.

### Listing Option Lists

**Columns:** Name, Code, Options Count

### Creating an Option List

1. Click **Add Option List**
2. Enter **Name** and **Code**
3. Add options:
   - **Label** — What the user sees
   - **Value** — What gets stored
   - **Sort Order** — Position in the list
4. Click **Save**

---

## 7. Channels

**Route:** `/conversation/channels`

Configure the communication channels used to send and receive messages.

### Listing Channels

**Columns:** Name, Type, Status, Configuration

### Channel Types

| Channel | Icon | Configuration |
|---|---|---|
| **SMS** | 💬 | BulkSMS/NBSMS credentials, sender name |
| **WhatsApp** | 📱 | WhatsApp Business API phone ID, access token |
| **Email** | ✉️ | SMTP host, port, credentials, from address |
| **Telegram** | ✈️ | Bot token, webhook URL, webhook secret |
| **Mock** | 🧪 | For testing — no external dependency |

### Creating a Channel

1. Click **Add Channel**
2. Select **Channel Type**
3. Fill in the type-specific configuration:
   - **SMS:** Username, Password, Sender name
   - **WhatsApp:** Phone Number ID, Access Token, Webhook Token
   - **Email:** SMTP Host, Port, User, Password, Sender address
   - **Telegram:** Bot Token, Webhook URL, Webhook Secret
4. Click **Create**

### Channel Status

- 🟢 **Active** — Channel is configured and connected
- 🟡 **Inactive** — Channel is configured but disabled
- 🔴 **Error** — Channel configuration has issues

---

## 8. Participants

**Route:** `/conversation/participants`

People who have received or sent messages through the conversation engine.

### Listing Participants

**Columns:** Phone Number, Name, Registration Date, Conversations Count, Last Active

**Search:** By phone number or name

### Participant Detail

Click a participant row to see:
- Contact information
- All conversations (active and historical)
- Response history
- Channel preferences

---

## 9. Broadcasts

**Route:** `/conversation/broadcasts`

Mass messaging capabilities for sending messages to multiple participants.

### Listing Broadcasts

**Columns:** Name, Channel, Recipients Count, Status, Scheduled Date, Sent Date

### Creating a Broadcast

1. Click **Add Broadcast**
2. Configure:
   - **Name** (required)
   - **Channel** (select)
   - **Recipients** — Select participants or upload a list
   - **Message Template** — Select a notification template
   - **Schedule** — Send immediately or schedule for later
3. Click **Create**

### Broadcast Status

- **Draft** — Not yet sent
- **Scheduled** — Queued for future delivery
- **In Progress** — Currently sending
- **Completed** — All messages delivered
- **Partial** — Some messages failed
- **Failed** — Delivery failed

---

## 10. Exchanges (Message History)

**Route:** `/conversation/exchanges`

Complete log of all messages sent and received.

### Listing Exchanges

**Columns:** Timestamp, Direction (Inbound/Outbound), Channel, Participant, Message Preview, Status

**Filters:**
- Date/time range
- Channel
- Direction
- Participant

### Exchange Detail

**Route:** `/conversation/exchanges/:exchangeId`

Full message details:
- Raw message content
- Channel used
- Direction
- Timestamp
- Delivery status
- Error details (if failed)
- Linked conversation and questionnaire

---

## 11. Workflows

**Route:** `/conversation/workflows`

Workflow definitions that automate actions based on conversation events.

### Listing Workflows

**Columns:** Name, Code, Description, States Count, Transitions Count

### Creating a Workflow

1. Click **Add Workflow**
2. Define:
   - **Name** and **Code**
   - **States** — Possible states (e.g., "initiated", "in_progress", "completed", "failed")
   - **Initial State** — Starting state
   - **Transitions** — Rules for moving between states:
     - **From State** → **To State**
     - **Trigger Event** — e.g., `CONVERSATION_STARTED`, `ANSWER_VALID`, `CONVERSATION_COMPLETED`
     - **Conditions** — Optional guards
   - **Actions** — What happens when a transition fires:
     - `HTTP_POST` — Send aggregated data to an external endpoint
     - `HTTP_GET` — Fetch data from an external endpoint
3. Click **Create**

### Workflow Instance

When a conversation links to a workflow:
1. A **workflow instance** is created for each conversation
2. Conversation events trigger transitions
3. The instance tracks current state and history
4. Actions execute with the aggregated conversation payload

---

## 12. Workflow Configuration

**Route:** `/conversation/workflow-configuration`

Settings and defaults for workflow execution.

**Configuration options:**
- Default timeout for workflow instances
- Retry policies for failed actions
- Notification settings for workflow events
- Default workflow for new questionnaires

---

## 13. Workflow Instances

**Route:** `/conversation/workflow-instances`

Running instances of workflows tied to conversations.

### Listing Instances

**Columns:** Workflow, Conversation, Current State, Created, Last Transition, Status

**Filters:** Workflow, state, date range

### Instance Detail

Click an instance to see:
- Current state
- Full state transition history
- Actions executed (with request/response)
- Linked conversation and participant
- Timeline of events

---

## 14. Workflow Events

**Route:** `/conversation/workflow-events`

Log of all workflow events (transitions, actions, errors).

**Columns:** Timestamp, Workflow Instance, Event Type, From State, To State, Action, Status

---

## 15. Projections

**Route:** `/conversation/projections`

Aggregated views of conversation and workflow data.

**Projections available:**
- **Active Conversations** — Currently running
- **Completion Rates** — By questionnaire, channel, time period
- **Response Times** — Average time between questions
- **Channel Performance** — Delivery rates by channel

---

## 16. End-to-End Flow (User Perspective)

Here's what happens when a patient interaction occurs:

1. **Inbound message arrives** (SMS/WhatsApp/Email/Telegram)
   - A webhook hits the conversation engine
   - The participant is looked up by phone number (created if new)

2. **Conversation starts**
   - An active conversation is created from the linked questionnaire
   - If a workflow is linked, a workflow instance starts
   - The first question is rendered and sent via the resolved channel

3. **Patient responds**
   - The answer arrives via the channel webhook
   - The question processor validates the answer
   - Invalid → Error message sent, question resent
   - Valid → Answer stored, next question sent

4. **Conversation completes**
   - All questions answered
   - CONVERSATION_COMPLETED event emitted
   - Workflow transitions to final state
   - Actions execute (e.g., POST aggregated data to backend)

5. **Monitoring in real-time**
   - The Chats page shows the live conversation
   - Exchanges log every message
   - Workflow Instances track state progression

---

## 17. Tips & Shortcuts

| Feature | How To |
|---|---|
| **Quick participant search** | Search by phone number in Participants |
| **Live monitoring** | Open Chats → click a conversation for real-time view |
| **Test a questionnaire** | Use Mock channel to simulate without sending real messages |
| **Debug workflows** | Check Workflow Instances for state transitions and errors |
| **Review message delivery** | Check Exchanges for delivery status and errors |
| **Mass messaging** | Use Broadcasts for bulk outreach |

---

## 18. Troubleshooting

| Issue | Solution |
|---|---|
| Messages not sending | Check channel status is Active; verify credentials |
| WhatsApp webhook not received | Verify `WHATSAPP_WEBHOOK_TOKEN` and public URL in backend config |
| Telegram not responding | Ensure bot token is valid and webhook URL is accessible |
| Conversation stuck | Check the current question's validation rules; review Workflow Instances |
| Workflow action failed | Check the HTTP endpoint is reachable; review action logs in Workflow Events |
| Participant not found | New participants are auto-created on first message; check phone number format |
| Broadcast partially failed | Review individual message statuses; check for invalid phone numbers |

---

## 19. Related Documentation

- [MANUAL.conversation.md](./MANUAL.conversation.md) — Backend API reference
- [PRD.md](./PRD.md) — Full product requirements
- [sequencediagram.compact.md](../conversation/sequencediagram.compact.md) — Flow sequence diagrams
