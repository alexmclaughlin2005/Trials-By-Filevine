# API Documentation Map

A visual guide to navigating the Trials by Filevine API documentation.

## 📍 Where to Start

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🏠 START HERE: http://localhost:3001/docs                     │
│                                                                 │
│  Interactive Swagger UI - Test endpoints in your browser       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🗺️ Documentation Structure

```
docs/api/
│
├── 📖 README.md                           ← API Overview & Quick Start
│   ├── What is the API?
│   ├── How to authenticate
│   ├── Common workflows
│   └── Development setup
│
├── 📜 openapi.yaml (9,000+ lines)         ← Complete API Specification
│   ├── All 60+ endpoints
│   ├── Request/response schemas
│   ├── Authentication patterns
│   └── Import into Postman/Insomnia
│
├── 🤖 CONVERSATIONAL_AI_GUIDE.md          ← AI Agent Integration Guide
│   ├── Natural language → API mapping
│   ├── Complete workflow examples
│   ├── Entity extraction patterns
│   ├── Context management
│   ├── Error handling for conversations
│   └── Sample dialogue flows
│
├── ⚡ QUICK_REFERENCE.md                  ← Developer Cheat Sheet
│   ├── Common endpoints
│   ├── cURL examples
│   ├── Authentication snippets
│   ├── Status codes
│   └── 10 Behavioral Archetypes
│
└── 🗺️ API_DOCUMENTATION_MAP.md            ← This file!
    └── Visual guide to all docs
```

## 🎯 Choose Your Path

### 👨‍💻 For Developers

**I want to...**

- **Test the API right now**
  → Open [Swagger UI](http://localhost:3001/docs)

- **See all available endpoints**
  → [README.md](./README.md) - API Endpoints section

- **Get started quickly**
  → [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

- **Import into Postman**
  → http://localhost:3001/openapi.json

- **Understand authentication**
  → [README.md](./README.md) - Authentication section

### 🤖 For AI Agent Developers

**I want to...**

- **Build a conversational interface**
  → [CONVERSATIONAL_AI_GUIDE.md](./CONVERSATIONAL_AI_GUIDE.md)

- **Parse user intents**
  → CONVERSATIONAL_AI_GUIDE.md - Natural Language Processing Tips

- **Handle async operations**
  → CONVERSATIONAL_AI_GUIDE.md - Async Operations section

- **See complete workflow examples**
  → CONVERSATIONAL_AI_GUIDE.md - Common Workflows (with code)

- **Understand error handling**
  → CONVERSATIONAL_AI_GUIDE.md - Error Handling section

### 📚 For Product/Business

**I want to...**

- **See what the API can do**
  → [README.md](./README.md) - API Categories section

- **Understand the features**
  → [Swagger UI](http://localhost:3001/docs) - Browse visually

- **Get a high-level overview**
  → [README.md](./README.md) - Overview section

- **See example use cases**
  → [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Example Use Cases

## 🔍 Find What You Need

### By Task

| Task | Documentation |
|------|---------------|
| **Quick API reference** | [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) |
| **Test an endpoint** | [Swagger UI](http://localhost:3001/docs) |
| **Build an AI agent** | [CONVERSATIONAL_AI_GUIDE.md](./CONVERSATIONAL_AI_GUIDE.md) |
| **Import to Postman** | http://localhost:3001/openapi.json |
| **cURL examples** | [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) |
| **Authentication flow** | [README.md](./README.md) - Authentication |
| **Error handling** | [README.md](./README.md) - Error Handling |
| **Rate limiting** | [README.md](./README.md) - Rate Limiting |

### By API Category

| Category | Swagger UI Tag | Documentation |
|----------|---------------|---------------|
| **Authentication** | 🔑 Authentication | [README.md](./README.md#authentication) |
| **Cases** | 📁 Cases | [README.md](./README.md#cases) |
| **Jurors** | 👥 Jurors | [README.md](./README.md#jurors) |
| **Archetypes** | 🎭 Archetypes | [README.md](./README.md#archetypes) |
| **Focus Groups** | 🎯 Focus Groups | [README.md](./README.md#focus-groups) |
| **Research** | 🔬 Research | [README.md](./README.md#research) |
| **Synthesis** | 🧠 Synthesis | [README.md](./README.md#synthesis) |
| **Captures** | 📸 Captures | [README.md](./README.md#captures) |

### By Complexity

| Level | Start Here |
|-------|-----------|
| **Beginner** | [Swagger UI](http://localhost:3001/docs) + [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) |
| **Intermediate** | [README.md](./README.md) + [openapi.yaml](./openapi.yaml) |
| **Advanced** | [CONVERSATIONAL_AI_GUIDE.md](./CONVERSATIONAL_AI_GUIDE.md) |

## 🎓 Learning Path

### Week 1: Getting Started
1. Read [README.md](./README.md) - Overview
2. Open [Swagger UI](http://localhost:3001/docs)
3. Test authentication endpoints
4. Try a few GET endpoints
5. Bookmark [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

### Week 2: Core Features
1. Create a case via API
2. Add jurors to the case
3. Classify a juror's archetype
4. Run a focus group simulation
5. Generate voir dire questions

### Week 3: Advanced Features
1. Implement identity resolution workflow
2. Use deep research synthesis
3. Handle async operations with polling
4. Implement error handling and retries
5. Test document capture (OCR)

### Week 4: Integration
1. Import OpenAPI spec into your tools
2. Build a simple client wrapper
3. Implement conversational AI patterns
4. Deploy and test in production
5. Monitor API usage and performance

## 📊 Content Summary

### openapi.yaml (9,000+ lines)
- **60+ endpoints** across 13 categories
- **Complete schemas** for all requests/responses
- **Authentication** patterns and security
- **Examples** for every endpoint
- **Import-ready** for tools

### README.md (600+ lines)
- **Overview** of all API features
- **Quick start** guide
- **Common workflows** with examples
- **Development** setup instructions
- **Deployment** guide for Railway
- **Troubleshooting** tips

### CONVERSATIONAL_AI_GUIDE.md (2,500+ lines)
- **Complete workflows** with JavaScript code
- **Natural language** intent mapping
- **Entity extraction** patterns
- **Context management** examples
- **Error handling** for conversations
- **Sample dialogues** showing AI interaction
- **Async operation** handling
- **Testing patterns**

### QUICK_REFERENCE.md (800+ lines)
- **Common endpoints** with cURL examples
- **Authentication** snippets
- **Key workflows** in bash
- **10 archetypes** quick reference
- **Status codes** and errors
- **Rate limiting** info
- **Example use cases**

## 🔗 Quick Links

### Live Documentation
- **Swagger UI**: http://localhost:3001/docs
- **API Info**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **OpenAPI YAML**: http://localhost:3001/openapi.yaml
- **OpenAPI JSON**: http://localhost:3001/openapi.json

### Static Documentation
- **Overview**: [README.md](./README.md)
- **AI Guide**: [CONVERSATIONAL_AI_GUIDE.md](./CONVERSATIONAL_AI_GUIDE.md)
- **Quick Ref**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **OpenAPI Spec**: [openapi.yaml](./openapi.yaml)

### Related Documentation
- **API Gateway**: [../../services/api-gateway/README.md](../../services/api-gateway/README.md)
- **Project Structure**: [../../ai_instructions.md](../../ai_instructions.md)
- **Architecture**: [../../Trials by Filevine_AI_Architecture.md](../../Trials by Filevine_AI_Architecture.md)
- **PRD**: [../../Trials by Filevine_AI_PRD.md](../../Trials by Filevine_AI_PRD.md)

## 🎯 Common Questions

### "Where do I start?"
→ Open [Swagger UI](http://localhost:3001/docs) and try the health endpoint

### "How do I authenticate?"
→ [QUICK_REFERENCE.md](./QUICK_REFERENCE.md#-authentication)

### "What can this API do?"
→ [README.md](./README.md#api-categories)

### "How do I build an AI agent?"
→ [CONVERSATIONAL_AI_GUIDE.md](./CONVERSATIONAL_AI_GUIDE.md)

### "I need a quick cURL example"
→ [QUICK_REFERENCE.md](./QUICK_REFERENCE.md#-common-workflows)

### "What are the 10 archetypes?"
→ [QUICK_REFERENCE.md](./QUICK_REFERENCE.md#-10-behavioral-archetypes)

### "How do async operations work?"
→ [CONVERSATIONAL_AI_GUIDE.md](./CONVERSATIONAL_AI_GUIDE.md#async-operations)

### "Can I import into Postman?"
→ Yes! http://localhost:3001/openapi.json

## 📱 Mobile-Friendly

All documentation is mobile-responsive:
- ✅ Swagger UI works on tablets
- ✅ Markdown docs readable on phones
- ✅ Code examples properly formatted
- ✅ Tables collapse gracefully

## 🎨 Visual Hierarchy

```
                    ┌─────────────────────────┐
                    │   Swagger UI (Live)     │
                    │  🌐 Browser Interface   │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴────────────┐
                    │                        │
          ┌─────────▼─────────┐    ┌────────▼─────────┐
          │   README.md       │    │  openapi.yaml    │
          │  📖 Overview      │    │  📜 Full Spec    │
          └─────────┬─────────┘    └────────┬─────────┘
                    │                       │
        ┌───────────┴──────────┐           │
        │                      │           │
┌───────▼──────────┐  ┌────────▼─────────────────────┐
│ QUICK_REFERENCE  │  │ CONVERSATIONAL_AI_GUIDE     │
│ ⚡ Cheat Sheet   │  │ 🤖 AI Integration           │
└──────────────────┘  └──────────────────────────────┘
```

## 🚀 Next Steps

1. **Restart your dev server**
   ```bash
   cd services/api-gateway
   npm run dev
   ```

2. **Open Swagger UI**
   ```
   http://localhost:3001/docs
   ```

3. **Pick a guide based on your needs:**
   - Developer → [README.md](./README.md)
   - Quick reference → [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
   - AI integration → [CONVERSATIONAL_AI_GUIDE.md](./CONVERSATIONAL_AI_GUIDE.md)

4. **Start building!** 🎉

---

**Last Updated:** January 2026
**Version:** 1.0.0
**Maintained By:** Trials by Filevine Team
