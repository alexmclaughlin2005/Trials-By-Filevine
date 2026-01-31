# API Chat System & Prompt Management

**Last Updated:** January 26, 2026
**Status:** ✅ Production Ready (v1.1.0)

---

## Overview

The API Chat system provides a conversational interface for users to interact with the Trials by Filevine application using natural language. Powered by Claude 4.5 Sonnet, the chat assistant can execute API operations, create cases, manage jurors, and guide users through complex workflows.

### Key Features

- **Natural Language Interface** - Users describe what they want in plain English
- **Tool-Based Actions** - Claude uses tools to actually perform API operations (not just instructions)
- **Conversational Context** - Maintains conversation history for multi-turn interactions
- **Markdown Responses** - Clean formatting with clickable links to resources
- **Version-Managed Prompts** - Centralized prompt management with A/B testing support

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  apps/web/components/api-chat-panel.tsx                     │
│  - Chat UI with markdown rendering                          │
│  - Conversation history sidebar                             │
│  - Message submission & display                             │
└──────────────────────┬──────────────────────────────────────┘
                       │ POST /api/chat
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│  services/api-gateway/src/routes/chat.ts                    │
│  - Conversation management                                   │
│  - Prompt fetching from Prompt Service                      │
│  - Agentic loop with tool execution                         │
│  - Response storage & tracking                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ↓                              ↓
┌─────────────────┐          ┌──────────────────┐
│ Prompt Service  │          │  Chat Tools      │
│  Port 3002      │          │  chat-tools.ts   │
│                 │          │                  │
│ - Prompt fetch  │          │ - create_case    │
│ - Version mgmt  │          │ - list_cases     │
│ - A/B testing   │          │ - get_case       │
│ - Analytics     │          │ - add_juror      │
└─────────────────┘          │ - classify_...   │
                             └──────────────────┘
```

### Request Flow

1. **User Input** → Frontend chat panel
2. **API Call** → POST `/api/chat` with message & optional conversationId
3. **Prompt Fetch** → Get latest version of `api-chat-assistant` prompt
4. **Claude API** → Send message + system prompt + available tools
5. **Agentic Loop:**
   - Claude decides to use a tool → Execute tool → Send result back to Claude
   - Loop continues until Claude provides final text response (max 5 iterations)
6. **Store Response** → Save to database with metadata (tokens, tools used, latency)
7. **Return to User** → Display formatted markdown response

---

## Prompt Management Strategy

### Version-Controlled Prompts

We use a centralized **Prompt Service** to manage all AI prompts across the application. This provides:

- **Version Control** - Track prompt changes over time
- **A/B Testing** - Compare different prompt versions
- **Analytics** - Track success rates, token usage, and latency
- **Rollback** - Quickly revert to previous versions if needed
- **Consistency** - Ensure all services use the same prompts

### Prompt Versioning

Prompts follow semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR** - Breaking changes to prompt structure or capabilities
- **MINOR** - New features or significant improvements (e.g., adding link formatting)
- **PATCH** - Bug fixes or minor wording improvements

**Example:**
- `1.0.0` - Initial API chat assistant
- `1.1.0` - Added markdown link formatting instructions
- `1.1.1` - Minor wording improvements (future)

### Current Prompt Version: 1.1.0

**Service ID:** `api-chat-assistant`
**Model:** `claude-sonnet-4-5-20250929`
**Max Tokens:** 1024
**Temperature:** 0.7

**Key Features of v1.1.0:**
- Tool-based action execution (actually performs operations)
- Markdown link formatting for created resources
- Conversational and helpful tone
- Clear explanations of actions taken

---

## Prompt Engineering Philosophy

### Core Principles

1. **Action-Oriented** - Claude should USE tools, not just explain them
2. **Clear Feedback** - Always confirm what was done and show results
3. **Helpful Links** - Provide clickable navigation to created resources
4. **Conversational** - Natural, friendly tone that matches user expectations
5. **Concise** - Get to the point, avoid unnecessary verbosity

### Link Formatting Strategy

**Why Links Matter:**
Users expect to navigate directly to resources they create. Without links, they have to manually find cases, jurors, etc.

**Implementation:**
```markdown
✅ Good: "I've created the case [Smith v. Jones](/cases/abc123) for you."
❌ Bad:  "I've created the case Smith v. Jones with ID abc123."
```

**Format Rules:**
- Cases: `[Case Name](/cases/{caseId})`
- Jurors: `[Juror Name](/cases/{caseId}/jurors?juror={jurorId})`
- Documents: `[Document Name](/cases/{caseId}/documents/{docId})`

### Tool Use Instructions

The prompt explicitly tells Claude:

> "You have access to tools that allow you to actually perform API operations for the user. When a user asks you to do something:
> 1. Use the appropriate tool to perform the action
> 2. Confirm what was done and show the result
> 3. Ask if they need anything else"

This ensures Claude:
- ✅ Takes action automatically
- ✅ Provides confirmation
- ✅ Maintains conversation flow

**NOT:**
- ❌ Just telling users how to use the API
- ❌ Providing code examples instead of acting
- ❌ Asking for permission before every action

---

## Available Tools

### 1. create_case

Creates a new case in the system.

**Input Schema:**
```json
{
  "name": "string (required)",
  "caseNumber": "string (optional)",
  "caseType": "string (e.g., 'civil', 'criminal')",
  "plaintiffName": "string",
  "defendantName": "string",
  "ourSide": "string (plaintiff or defendant)"
}
```

**Response:**
```json
{
  "success": true,
  "case": { /* full case object */ },
  "message": "Case \"[name]\" created successfully with ID: [id]"
}
```

### 2. list_cases

Lists all cases for the current organization.

**Input Schema:** `{}`

**Response:**
```json
{
  "success": true,
  "cases": [ /* array of case objects */ ],
  "count": 5
}
```

### 3. get_case

Gets details of a specific case.

**Input Schema:**
```json
{
  "caseId": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "case": {
    /* case details with counts of related entities */
  }
}
```

### 4. add_juror

Adds a juror to a case (auto-creates jury panel if needed).

**Input Schema:**
```json
{
  "caseId": "string (required)",
  "name": "string (required)",
  "age": "number (optional)",
  "gender": "string (optional)",
  "occupation": "string (optional)",
  "education": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "juror": { /* juror object */ },
  "message": "Juror \"[name]\" added successfully and assigned to case"
}
```

### 5. classify_juror_archetype

Classifies a juror into psychological archetypes (placeholder - requires AI integration).

**Input Schema:**
```json
{
  "jurorId": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Archetype classification requires additional juror information...",
  "jurorId": "[id]",
  "jurorName": "[name]"
}
```

---

## Conversation Management

### Database Schema

**ChatConversation:**
- `id` - Unique conversation identifier
- `userId` - Owner of the conversation
- `organizationId` - Organization context
- `title` - Generated from first message
- `lastMessageAt` - Timestamp of last activity
- `createdAt` - When conversation started

**ChatMessage:**
- `id` - Unique message identifier
- `conversationId` - Parent conversation
- `role` - `user` or `assistant`
- `content` - Message text (markdown formatted)
- `toolsUsed` - Boolean flag
- `toolCalls` - JSON array of tool calls made
- `tokensUsed` - Total tokens consumed
- `createdAt` - Message timestamp

### Conversation History

The system maintains full conversation context:

```typescript
// Build conversation history for Claude
const messages: Anthropic.MessageParam[] = [
  ...conversationHistory.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  })),
  {
    role: 'user' as const,
    content: message, // Current message
  },
];
```

This allows:
- Multi-turn conversations
- Context-aware responses
- Follow-up questions without repeating information

---

## Agentic Loop Implementation

### Why Agentic?

Claude may need multiple tool calls to complete a task:

**Example Flow:**
1. User: "Create a case and add two jurors"
2. Claude: Uses `create_case` tool → Gets case ID
3. Claude: Uses `add_juror` tool (first juror) → Confirms added
4. Claude: Uses `add_juror` tool (second juror) → Confirms added
5. Claude: Returns final text response with summary and links

### Loop Structure

```typescript
let continueLoop = true;
let iterationCount = 0;
const maxIterations = 5; // Prevent infinite loops

while (continueLoop && iterationCount < maxIterations) {
  iterationCount++;

  const response = await anthropic.messages.create({
    model: prompt.config.model,
    system: enhancedSystemPrompt,
    messages,
    tools: chatTools,
  });

  const toolUseBlock = response.content.find(
    (block) => block.type === 'tool_use'
  );

  if (toolUseBlock && toolUseBlock.type === 'tool_use') {
    // Execute tool
    const toolResult = await executeTool(...);

    // Add assistant response + tool result to messages
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: [{ type: 'tool_result', ... }] });

    // Continue loop
    continue;
  } else {
    // Final response - extract text and exit
    finalResponse = extractText(response);
    continueLoop = false;
  }
}
```

### Safety Limits

- **Max Iterations:** 5 (prevents infinite loops)
- **Token Tracking:** Sum tokens across all iterations
- **Error Handling:** Catches tool execution failures
- **Logging:** Tracks each tool call for debugging

---

## Frontend Implementation

### Chat UI Component

**File:** `apps/web/components/api-chat-panel.tsx`

**Features:**
- Message bubble design (user right, assistant left)
- AI avatar badge with gradient
- Markdown rendering via `SimpleMarkdown` component
- Auto-scroll to latest message
- Loading states during API calls
- Error handling with user-friendly messages

### Markdown Rendering

**File:** `apps/web/components/simple-markdown.tsx`

Custom markdown parser compatible with React 19:

**Supported Syntax:**
- Headers (`#`, `##`, `###`)
- Bold (`**text**`)
- Italic (`*text*`)
- Links (`[text](url)`)
- Code blocks (`` ```language `` ... `` ``` ``)
- Inline code (`` `code` ``)
- Lists (`-`, `*`, `1.`)

**Why Custom?**
- React 19 compatibility issues with `react-markdown`
- Lightweight (no heavy dependencies)
- Full control over styling
- Fast rendering

### Conversation Sidebar

**Features:**
- Collapsible history panel
- List of past conversations with titles
- Timestamps for each conversation
- Quick navigation between conversations
- Delete conversation functionality
- Clean, minimal design

---

## Deployment & Seeding

### Production Setup

**Prompt Service:** Railway deployment on port 3002

**Required Environment Variables:**
```bash
ANTHROPIC_API_KEY=sk-...
PROMPT_SERVICE_URL=https://prompt-service.railway.app
DATABASE_URL=postgresql://...
```

### Seeding Prompts to Production

**Script:** `scripts/seed-api-chat-prompt.ts`

**Usage:**
```bash
# Seed or update the api-chat-assistant prompt
DATABASE_URL="postgresql://..." npx tsx scripts/seed-api-chat-prompt.ts
```

**What it does:**
1. Checks if prompt exists (by `serviceId`)
2. If exists: Creates new version (e.g., 1.1.0) and sets as current
3. If not: Creates prompt with initial version 1.0.0
4. Updates `currentVersionId` to point to latest version

**Version History:**
- `1.0.0` - Initial release (Jan 25, 2026)
- `1.1.0` - Added markdown link formatting (Jan 26, 2026)

### Production Seed Script

**File:** `seed-production.ts`

Includes the API chat prompt as part of the full production seed. When seeding a fresh database, it creates:
- Organizations
- Sample users
- System personas
- **API Chat Prompt v1.1.0**
- Sample cases & jurors

---

## Analytics & Monitoring

### Tracked Metrics

For each chat interaction:

```typescript
await promptClient.trackResult('api-chat-assistant', {
  versionId: prompt.versionId,
  success: true,
  tokensUsed: totalTokensUsed,
  latencyMs: Date.now() - startTime,
  metadata: {
    iterationCount,
    hadToolUse: iterationCount > 1,
  },
});
```

**Metrics:**
- **Success Rate** - Percentage of successful completions
- **Token Usage** - Input + output tokens per request
- **Latency** - End-to-end response time
- **Tool Usage** - How often tools are invoked
- **Iteration Count** - Average number of agentic loops

### Prompt Performance Dashboard

Access via Prompt Service API:

```bash
GET /api/v1/prompts/api-chat-assistant/analytics
```

Returns:
- Total requests
- Average token usage
- Average latency
- Success rate
- Tool usage breakdown

---

## Best Practices

### Prompt Engineering

1. **Be Specific** - Clear instructions produce better results
2. **Use Examples** - Show Claude the exact format you want
3. **Set Expectations** - Tell Claude what NOT to do (e.g., "don't ask for permission")
4. **Test Iterations** - Try prompts with real user queries
5. **Version Carefully** - Only bump versions when actually changing behavior

### Tool Design

1. **Minimal Required Fields** - Only require what's truly necessary
2. **Clear Descriptions** - Tool descriptions should explain purpose clearly
3. **Useful Responses** - Return all info Claude needs to respond to user
4. **Error Messages** - Make error responses actionable
5. **Idempotency** - Tools should be safe to retry

### Conversation Management

1. **Limit History** - Don't send entire conversation (just recent context)
2. **Prune Old Data** - Archive conversations after 30 days
3. **Handle Interruptions** - Allow users to change topics mid-conversation
4. **Provide Restart** - Easy way to start fresh conversation

---

## Troubleshooting

### Common Issues

**Issue:** Chat not responding in production

**Diagnosis:**
- Check browser console for API errors
- Verify `NEXT_PUBLIC_API_URL` is set in Vercel
- Check Railway logs for API Gateway errors
- Ensure Prompt Service is running

**Issue:** Prompt not found error

**Diagnosis:**
```
Prompt not found: api-chat-assistant
```

**Solution:**
```bash
DATABASE_URL="..." npx tsx scripts/seed-api-chat-prompt.ts
```

**Issue:** Links not appearing in responses

**Diagnosis:**
- Check prompt version (should be 1.1.0+)
- Verify current version is set correctly
- Review Claude's response in logs

**Solution:**
Update to latest prompt version:
```bash
DATABASE_URL="..." npx tsx scripts/seed-api-chat-prompt.ts
```

**Issue:** Tool execution failures

**Diagnosis:**
- Check API Gateway logs for tool execution errors
- Verify database connectivity
- Check user permissions (organizationId)

---

## Future Enhancements

### Planned Features

1. **Enhanced Tools**
   - Search jurors by criteria
   - Generate voir dire questions via chat
   - Run focus group simulations
   - Upload documents

2. **Conversation Features**
   - Conversation search
   - Export conversation to PDF
   - Share conversations with team
   - Pin important conversations

3. **Prompt Improvements**
   - Context-aware suggestions
   - Auto-complete for common tasks
   - Voice input support
   - Multi-language support

4. **Analytics**
   - User satisfaction tracking
   - Common query patterns
   - Tool usage heatmaps
   - Performance optimization insights

---

## References

### Related Documentation

- [CURRENT_STATE.md](./CURRENT_STATE.md) - Overall system status
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment
- [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) - Architecture overview
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Development setup

### Key Files

**Frontend:**
- `apps/web/components/api-chat-panel.tsx` - Chat UI
- `apps/web/components/simple-markdown.tsx` - Markdown renderer
- `apps/web/app/globals.css` - Markdown styles

**Backend:**
- `services/api-gateway/src/routes/chat.ts` - Chat endpoint
- `services/api-gateway/src/routes/chat-tools.ts` - Tool definitions
- `services/prompt-service/` - Prompt management service

**Scripts:**
- `scripts/seed-api-chat-prompt.ts` - Prompt seeding
- `seed-production.ts` - Full production seed

### External Resources

- [Anthropic Tool Use Documentation](https://docs.anthropic.com/claude/docs/tool-use)
- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [Fastify Documentation](https://www.fastify.io/)
