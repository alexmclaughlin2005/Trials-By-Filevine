# ✅ Swagger UI Setup Complete!

## 🎉 What's New

Interactive API documentation with Swagger UI has been added to your Trials by Filevine application!

## 🚀 Quick Start

### 1. Restart the API Gateway

```bash
cd services/api-gateway
npm run dev
```

You should see the new startup banner:

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  🚀 Trials by Filevine API Gateway                            ║
║                                                                ║
║  Status: Running                                               ║
║  Environment: development                                      ║
║  Port: 3001                                                    ║
║                                                                ║
║  📚 API Documentation:                                         ║
║     Swagger UI: http://localhost:3001/docs                    ║
║     OpenAPI YAML: http://localhost:3001/openapi.yaml         ║
║     OpenAPI JSON: http://localhost:3001/openapi.json         ║
║                                                                ║
║  🔗 Endpoints:                                                 ║
║     Root: http://localhost:3001                               ║
║     Health: http://localhost:3001/health                      ║
║     Auth: http://localhost:3001/api/auth                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

### 2. Access Swagger UI

Open in your browser:
```
http://localhost:3001/docs
```

### 3. Test It Out

1. **Try a public endpoint first:**
   - Expand `GET /health`
   - Click "Try it out"
   - Click "Execute"
   - You should see a 200 response with database status

2. **Test authentication:**
   - Expand `POST /api/auth/login`
   - Click "Try it out"
   - Enter test credentials:
     ```json
     {
       "email": "test@example.com",
       "password": "password"
     }
     ```
   - Click "Execute"
   - Copy the JWT token from the response

3. **Authorize for protected endpoints:**
   - Click the green "Authorize" button at the top
   - Enter: `Bearer YOUR_JWT_TOKEN`
   - Click "Authorize"
   - Click "Close"

4. **Test a protected endpoint:**
   - Expand `GET /api/cases`
   - Click "Try it out"
   - Click "Execute"
   - You should see your cases!

## 📚 Documentation Access

| Resource | URL | Description |
|----------|-----|-------------|
| **Swagger UI** | http://localhost:3001/docs | Interactive API browser |
| **API Info** | http://localhost:3001 | API information and links |
| **Health Check** | http://localhost:3001/health | Service health status |
| **OpenAPI YAML** | http://localhost:3001/openapi.yaml | Download YAML spec |
| **OpenAPI JSON** | http://localhost:3001/openapi.json | Download JSON spec |

## 📖 Documentation Files

New documentation has been created in `docs/api/`:

1. **[openapi.yaml](./docs/api/openapi.yaml)** (9,000+ lines)
   - Complete OpenAPI 3.0 specification
   - All 60+ endpoints documented
   - Request/response schemas with examples
   - Authentication and security patterns

2. **[README.md](./docs/api/README.md)**
   - API overview and categories
   - Quick start guide
   - Common workflows
   - Testing instructions

3. **[CONVERSATIONAL_AI_GUIDE.md](./docs/api/CONVERSATIONAL_AI_GUIDE.md)** (2,500+ lines)
   - Complete guide for building AI agents
   - Natural language processing patterns
   - Entity extraction examples
   - Sample conversation flows
   - Async operation handling

4. **[QUICK_REFERENCE.md](./docs/api/QUICK_REFERENCE.md)**
   - Quick reference card for developers
   - Common endpoints and workflows
   - cURL examples
   - Status codes and error handling

## 🎯 Key Features

### For Developers
- ✅ Test endpoints directly in browser
- ✅ View request/response schemas
- ✅ See example payloads
- ✅ Authenticate and make real API calls
- ✅ Download OpenAPI spec for tools

### For AI Agents
- ✅ Complete API specification in YAML/JSON
- ✅ Natural language workflow examples
- ✅ Entity extraction patterns
- ✅ Conversational error handling
- ✅ Sample dialogue flows

### For Documentation
- ✅ Auto-generated from route definitions
- ✅ Always up-to-date with code
- ✅ Searchable and filterable
- ✅ Dark/light theme support

## 🔧 What Changed

### Modified Files
- `services/api-gateway/src/server.ts` - Added Swagger plugins
- `services/api-gateway/src/index.ts` - Enhanced startup banner
- `services/api-gateway/package.json` - Added Swagger dependencies
- `services/api-gateway/README.md` - Added Swagger documentation

### New Files
- `services/api-gateway/src/routes/api-docs.ts` - API doc routes
- `docs/api/openapi.yaml` - Complete OpenAPI spec
- `docs/api/README.md` - API overview
- `docs/api/CONVERSATIONAL_AI_GUIDE.md` - AI agent guide
- `docs/api/QUICK_REFERENCE.md` - Developer reference

## 🛠️ Import into Tools

### Postman
1. Open Postman
2. Import → Link
3. Enter: `http://localhost:3001/openapi.json`
4. Postman will create a collection with all endpoints

### Insomnia
1. Open Insomnia
2. Import/Export → Import Data
3. From URL: `http://localhost:3001/openapi.yaml`
4. All endpoints will be imported

### VS Code REST Client
1. Install "REST Client" extension
2. Create a `.http` file
3. Add:
   ```http
   ### Login
   POST http://localhost:3001/api/auth/login
   Content-Type: application/json

   {
     "email": "test@example.com",
     "password": "password"
   }
   ```

## 🎓 Example Workflows

### Create Case and Add Juror
1. In Swagger UI, expand `POST /api/cases`
2. Try it out with:
   ```json
   {
     "name": "Smith v. Jones",
     "caseNumber": "2024-CV-001",
     "caseType": "Personal Injury",
     "ourSide": "plaintiff"
   }
   ```
3. Copy the `panelId` from response
4. Expand `POST /api/jurors` and add juror:
   ```json
   {
     "panelId": "PANEL_ID_HERE",
     "jurorNumber": "5",
     "firstName": "John",
     "lastName": "Smith",
     "age": 45,
     "occupation": "Engineer"
   }
   ```

### Classify Juror Archetype
1. Expand `POST /api/archetypes/classify/juror`
2. Try it out with:
   ```json
   {
     "jurorId": "JUROR_ID_HERE",
     "includeResearch": true,
     "caseType": "Personal Injury",
     "ourSide": "plaintiff"
   }
   ```
3. View the archetype classification with confidence scores!

### Run Focus Group
1. Expand `POST /api/focus-groups/simulate`
2. Try it out with:
   ```json
   {
     "caseId": "CASE_ID_HERE",
     "argumentId": "ARGUMENT_ID_HERE",
     "simulationMode": "detailed"
   }
   ```
3. See AI-powered persona reactions!

## 🚢 Production Ready

The Swagger UI works in both development and production:

- **Development**: http://localhost:3001/docs
- **Production**: https://your-api.railway.app/docs

Server URLs are automatically detected based on the environment.

## 💡 Pro Tips

1. **Use the filter** in Swagger UI to quickly find endpoints
2. **Deep linking** - Share URLs to specific endpoints
3. **Request duration** is displayed for performance testing
4. **Download the spec** for offline reference
5. **Try the Quick Reference** for common cURL commands

## 🆘 Troubleshooting

### Server won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm run dev
```

### Swagger UI shows empty
- Check that server started successfully
- Verify no errors in console
- Try accessing http://localhost:3001/openapi.json directly

### Authentication issues
- Make sure to use `Bearer` prefix: `Bearer YOUR_TOKEN`
- Check token hasn't expired (7 day expiration)
- Verify token at https://jwt.io

### Can't find endpoint
- Use the filter/search in Swagger UI
- Check the endpoint category (tags)
- Refer to Quick Reference for exact paths

## 🎊 You're All Set!

Your API is now fully documented and ready for:
- ✅ Developer testing and exploration
- ✅ Team collaboration
- ✅ Client integration
- ✅ AI agent development
- ✅ Postman/Insomnia imports

**Next Steps:**
1. Restart your dev server
2. Open http://localhost:3001/docs
3. Start exploring and testing!

---

**Need Help?**
- Swagger UI Guide: http://localhost:3001/docs
- API Overview: [docs/api/README.md](./docs/api/README.md)
- Quick Reference: [docs/api/QUICK_REFERENCE.md](./docs/api/QUICK_REFERENCE.md)
- AI Integration: [docs/api/CONVERSATIONAL_AI_GUIDE.md](./docs/api/CONVERSATIONAL_AI_GUIDE.md)

Happy coding! 🚀
