# Complete Filevine API Integration Guide

## Overview

This guide provides a complete, step-by-step implementation for integrating with the Filevine API v2 using OAuth 2.0 authentication. This implementation was discovered through extensive testing and includes undocumented requirements that are critical for success.

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Critical Requirements](#critical-requirements)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Code Examples](#code-examples)
5. [Common Pitfalls](#common-pitfalls)
6. [Testing & Verification](#testing--verification)

---

## Authentication Flow

### The Complete OAuth 2.0 Flow with Filevine

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: OAuth Token Exchange                                     │
│ POST https://identity.filevine.com/connect/token                 │
│ → Returns: JWT Access Token                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Extract Session ID from JWT                              │
│ Parse JWT payload → Extract 'jti' claim                          │
│ → Returns: Session ID for x-fv-sessionid header                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Get Numeric User/Org IDs                                 │
│ POST https://api.filevineapp.com/fv-app/v2/utils/               │
│      GetUserOrgsWithToken                                         │
│ → Returns: Numeric user_id and org_id                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Make API Calls with All Headers                          │
│ GET/POST/PUT/DELETE https://api.filevineapp.com/fv-app/v2/*     │
│ Headers:                                                          │
│   - Authorization: Bearer {access_token}                          │
│   - x-fv-userid: {numeric_user_id} ← FROM GetUserOrgsWithToken  │
│   - x-fv-orgid: {numeric_org_id}                                 │
│   - x-fv-sessionid: {jti_from_jwt}                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Critical Requirements

### ❗ IMPORTANT: These are NOT in Filevine's Public Documentation

1. **Correct Base URL**: 
   - ✅ Use: `https://api.filevineapp.com/fv-app/v2`
   - ❌ NOT: `https://api.filevine.io/v2`

2. **Numeric User ID**:
   - ✅ Use the **numeric** `user.userId.native` from `GetUserOrgsWithToken` response
   - ❌ NOT the UUID `sub` claim from the JWT token

3. **Three Required Headers**:
   - `x-fv-userid` - Numeric user ID (e.g., `990021049`)
   - `x-fv-orgid` - Organization ID (e.g., `990000459`)
   - `x-fv-sessionid` - JWT `jti` claim (session identifier)

4. **Endpoint Naming**:
   - ✅ Use PascalCase: `/Projects`, `/ProjectTypes`, `/Contacts`
   - ❌ NOT lowercase: `/projects`, `/projecttypes`, `/contacts`

5. **OAuth Scope**:
   - Minimum required: `fv.api.gateway.access tenant filevine.v2.api.* email openid fv.auth.tenant.read`

---

## Step-by-Step Implementation

### Step 1: Obtain OAuth Credentials from Filevine

1. Log into Filevine
2. Navigate to: **Settings → Developer → API Credentials**
3. Create/Copy:
   - Client ID (UUID format)
   - Client Secret (alphanumeric string)
   - Personal Access Token (PAT) (64-character hex string)

### Step 2: Implement OAuth Token Exchange

```python
import httpx
import json
import base64
from typing import Dict, Tuple

async def authenticate_filevine(
    client_id: str,
    client_secret: str,
    personal_access_token: str
) -> Tuple[str, str, str]:
    """
    Complete Filevine authentication flow.
    
    Returns: (access_token, numeric_user_id, session_id)
    """
    
    # Step 1: OAuth Token Exchange
    token_response = await httpx.AsyncClient().post(
        "https://identity.filevine.com/connect/token",
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "personal_access_token",
            "token": personal_access_token,
            "scope": "fv.api.gateway.access tenant filevine.v2.api.* email openid fv.auth.tenant.read"
        },
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        },
        timeout=30
    )
    
    if token_response.status_code != 200:
        raise Exception(f"Token exchange failed: {token_response.text}")
    
    access_token = token_response.json()["access_token"]
    
    # Step 2: Extract Session ID from JWT
    # JWT format: header.payload.signature
    payload_encoded = access_token.split('.')[1]
    
    # Add padding for base64 decoding
    padding = 4 - len(payload_encoded) % 4
    if padding != 4:
        payload_encoded += '=' * padding
    
    payload = json.loads(base64.b64decode(payload_encoded))
    session_id = payload.get('jti')  # Session ID
    
    # Step 3: Get Numeric User/Org IDs
    user_org_response = await httpx.AsyncClient().post(
        "https://api.filevineapp.com/fv-app/v2/utils/GetUserOrgsWithToken",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        },
        timeout=30
    )
    
    if user_org_response.status_code != 200:
        raise Exception(f"GetUserOrgsWithToken failed: {user_org_response.text}")
    
    user_org_data = user_org_response.json()
    
    # Extract NUMERIC user ID (not UUID from JWT!)
    numeric_user_id = str(user_org_data['user']['userId']['native'])
    org_id = str(user_org_data['orgs'][0]['orgId'])
    
    return access_token, numeric_user_id, org_id, session_id
```

### Step 3: Make API Calls with Proper Headers

```python
async def call_filevine_api(
    endpoint: str,
    access_token: str,
    user_id: str,
    org_id: str,
    session_id: str,
    method: str = "GET",
    data: Dict = None
) -> Dict:
    """
    Make an authenticated API call to Filevine.
    
    Args:
        endpoint: API endpoint (e.g., "/Projects", "/ProjectTypes")
        access_token: Bearer token from OAuth
        user_id: NUMERIC user ID from GetUserOrgsWithToken
        org_id: Organization ID
        session_id: JWT jti claim
        method: HTTP method (GET, POST, PUT, DELETE)
        data: Request body for POST/PUT
    
    Returns:
        API response as dictionary
    """
    
    url = f"https://api.filevineapp.com/fv-app/v2{endpoint}"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-fv-userid": str(user_id),      # ← NUMERIC ID!
        "x-fv-orgid": str(org_id),
        "x-fv-sessionid": str(session_id)  # ← JWT jti claim!
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        if method.upper() == "GET":
            response = await client.get(url, headers=headers)
        elif method.upper() == "POST":
            response = await client.post(url, headers=headers, json=data)
        elif method.upper() == "PUT":
            response = await client.put(url, headers=headers, json=data)
        elif method.upper() == "DELETE":
            response = await client.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported method: {method}")
    
    if response.status_code >= 400:
        raise Exception(f"API call failed ({response.status_code}): {response.text}")
    
    return response.json()
```

### Step 4: Complete Example Usage

```python
import asyncio

async def main():
    # Your credentials
    CLIENT_ID = "your-client-id-uuid"
    CLIENT_SECRET = "your-client-secret"
    PAT = "your-64-char-personal-access-token"
    
    # Authenticate
    access_token, user_id, org_id, session_id = await authenticate_filevine(
        CLIENT_ID,
        CLIENT_SECRET,
        PAT
    )
    
    print(f"✓ Authenticated!")
    print(f"  User ID: {user_id}")
    print(f"  Org ID: {org_id}")
    print(f"  Session ID: {session_id[:20]}...")
    
    # Test API call - Get Projects
    projects = await call_filevine_api(
        endpoint="/Projects?limit=10",
        access_token=access_token,
        user_id=user_id,
        org_id=org_id,
        session_id=session_id,
        method="GET"
    )
    
    print(f"\n✓ Retrieved {len(projects.get('items', []))} projects")
    
    # Test API call - Get Project Types
    project_types = await call_filevine_api(
        endpoint="/ProjectTypes",
        access_token=access_token,
        user_id=user_id,
        org_id=org_id,
        session_id=session_id,
        method="GET"
    )
    
    print(f"✓ Retrieved {len(project_types.get('items', []))} project types")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Code Examples

### FastAPI Service Implementation

```python
from typing import Optional, Dict, Any
import httpx
import json
import base64
from datetime import datetime, timedelta

class FilevineService:
    """Complete Filevine API service."""
    
    def __init__(
        self,
        client_id: str,
        client_secret: str,
        personal_access_token: str,
        org_id: str
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.personal_access_token = personal_access_token
        self.org_id = org_id
        self.base_url = "https://api.filevineapp.com/fv-app/v2"
        self.identity_url = "https://identity.filevine.com"
        
        # Cached authentication data
        self._access_token: Optional[str] = None
        self._user_id: Optional[str] = None
        self._session_id: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None
    
    def _extract_jwt_payload(self, jwt_token: str) -> Dict[str, Any]:
        """Extract JWT payload."""
        payload = jwt_token.split('.')[1]
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += '=' * padding
        return json.loads(base64.b64decode(payload))
    
    async def _authenticate(self) -> None:
        """Perform complete authentication flow."""
        
        # Step 1: Token Exchange
        token_response = await httpx.AsyncClient().post(
            f"{self.identity_url}/connect/token",
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "grant_type": "personal_access_token",
                "token": self.personal_access_token,
                "scope": "fv.api.gateway.access tenant filevine.v2.api.* email openid fv.auth.tenant.read"
            },
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            timeout=30
        )
        
        if token_response.status_code != 200:
            raise Exception(f"Authentication failed: {token_response.text}")
        
        token_data = token_response.json()
        self._access_token = token_data["access_token"]
        
        # Set token expiration (typically 1 hour)
        expires_in = token_data.get("expires_in", 3600)
        self._token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in - 60)
        
        # Step 2: Extract Session ID
        jwt_payload = self._extract_jwt_payload(self._access_token)
        self._session_id = jwt_payload.get('jti')
        
        # Step 3: Get User/Org IDs
        user_org_response = await httpx.AsyncClient().post(
            f"{self.base_url}/utils/GetUserOrgsWithToken",
            headers={"Authorization": f"Bearer {self._access_token}"},
            timeout=30
        )
        
        if user_org_response.status_code == 200:
            user_org_data = user_org_response.json()
            self._user_id = str(user_org_data['user']['userId']['native'])
            # Can also update org_id if needed:
            # self.org_id = str(user_org_data['orgs'][0]['orgId'])
    
    async def _ensure_authenticated(self) -> None:
        """Ensure we have valid authentication."""
        if (not self._access_token or 
            not self._token_expires_at or 
            datetime.utcnow() >= self._token_expires_at):
            await self._authenticate()
    
    async def _get_headers(self) -> Dict[str, str]:
        """Get headers for API requests."""
        await self._ensure_authenticated()
        
        return {
            "Authorization": f"Bearer {self._access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "x-fv-userid": self._user_id,
            "x-fv-orgid": self.org_id,
            "x-fv-sessionid": self._session_id
        }
    
    async def request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make an authenticated API request."""
        headers = await self._get_headers()
        url = f"{self.base_url}{endpoint}"
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=data
            )
            
            if response.status_code >= 400:
                raise Exception(f"API error ({response.status_code}): {response.text}")
            
            return response.json()
    
    # Convenience methods
    async def get_projects(self, limit: int = 50, offset: int = 0) -> Dict:
        """Get list of projects."""
        return await self.request("GET", "/Projects", params={"limit": limit, "offset": offset})
    
    async def get_project(self, project_id: str) -> Dict:
        """Get specific project."""
        return await self.request("GET", f"/Projects/{project_id}")
    
    async def get_project_types(self) -> Dict:
        """Get project types."""
        return await self.request("GET", "/ProjectTypes")
```

---

## Common Pitfalls

### ❌ Pitfall #1: Wrong Base URL

```python
# WRONG - This will give authentication errors
base_url = "https://api.filevine.io/v2"

# CORRECT
base_url = "https://api.filevineapp.com/fv-app/v2"
```

### ❌ Pitfall #2: Using UUID from JWT Instead of Numeric ID

```python
# WRONG - Using the 'sub' claim from JWT
jwt_payload = decode_jwt(access_token)
user_id = jwt_payload['sub']  # ← This is a UUID, NOT what Filevine expects!

# CORRECT - Call GetUserOrgsWithToken
response = post(f"{base_url}/utils/GetUserOrgsWithToken")
user_id = response.json()['user']['userId']['native']  # ← Numeric ID!
```

### ❌ Pitfall #3: Missing Required Headers

```python
# WRONG - Missing headers
headers = {
    "Authorization": f"Bearer {access_token}"
}

# CORRECT - All three custom headers required
headers = {
    "Authorization": f"Bearer {access_token}",
    "x-fv-userid": user_id,      # ← Required!
    "x-fv-orgid": org_id,         # ← Required!
    "x-fv-sessionid": session_id  # ← Required!
}
```

### ❌ Pitfall #4: Wrong Endpoint Casing

```python
# WRONG - Lowercase will return 404 or 500
endpoint = "/projects"
endpoint = "/projecttypes"

# CORRECT - PascalCase
endpoint = "/Projects"
endpoint = "/ProjectTypes"
```

### ❌ Pitfall #5: Not Extracting Session ID from JWT

```python
# WRONG - Using access token as session ID
session_id = access_token

# CORRECT - Extract 'jti' claim from JWT payload
payload = base64.b64decode(access_token.split('.')[1] + '==')
session_id = json.loads(payload)['jti']
```

---

## Testing & Verification

### Quick Test Script

```python
import asyncio
import httpx
import json
import base64

async def test_filevine_integration():
    """Test Filevine API integration."""
    
    # Replace with your credentials
    CLIENT_ID = "your-client-id"
    CLIENT_SECRET = "your-client-secret"
    PAT = "your-personal-access-token"
    ORG_ID = "your-org-id"
    
    print("Step 1: OAuth Token Exchange...")
    token_response = await httpx.AsyncClient().post(
        "https://identity.filevine.com/connect/token",
        data={
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "grant_type": "personal_access_token",
            "token": PAT,
            "scope": "fv.api.gateway.access tenant filevine.v2.api.* email openid fv.auth.tenant.read"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30
    )
    
    assert token_response.status_code == 200, f"Token exchange failed: {token_response.text}"
    access_token = token_response.json()["access_token"]
    print(f"✓ Access token obtained: {access_token[:30]}...")
    
    print("\nStep 2: Extract Session ID from JWT...")
    payload = access_token.split('.')[1]
    padding = 4 - len(payload) % 4
    if padding != 4:
        payload += '=' * padding
    claims = json.loads(base64.b64decode(payload))
    session_id = claims.get('jti')
    print(f"✓ Session ID: {session_id[:30]}...")
    
    print("\nStep 3: Get Numeric User/Org IDs...")
    user_org_response = await httpx.AsyncClient().post(
        "https://api.filevineapp.com/fv-app/v2/utils/GetUserOrgsWithToken",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=30
    )
    
    assert user_org_response.status_code == 200, f"GetUserOrgsWithToken failed: {user_org_response.text}"
    data = user_org_response.json()
    user_id = str(data['user']['userId']['native'])
    print(f"✓ User ID: {user_id}")
    print(f"✓ Org ID: {ORG_ID}")
    
    print("\nStep 4: Test API Call - GET /Projects...")
    projects_response = await httpx.AsyncClient().get(
        "https://api.filevineapp.com/fv-app/v2/Projects?limit=5",
        headers={
            "Authorization": f"Bearer {access_token}",
            "x-fv-userid": user_id,
            "x-fv-orgid": ORG_ID,
            "x-fv-sessionid": session_id
        },
        timeout=30
    )
    
    assert projects_response.status_code == 200, f"API call failed: {projects_response.text}"
    projects = projects_response.json()
    print(f"✓ Retrieved {len(projects.get('items', []))} projects")
    
    print("\n✅ ALL TESTS PASSED!")
    print("\nAuthentication Details:")
    print(f"  User ID (numeric): {user_id}")
    print(f"  Org ID: {ORG_ID}")
    print(f"  Session ID: Present")
    print(f"  Access Token: Valid")

if __name__ == "__main__":
    asyncio.run(test_filevine_integration())
```

### Expected Output

```
Step 1: OAuth Token Exchange...
✓ Access token obtained: eyJhbGciOiJSUzUxMiIsImtpZCI6Ij...

Step 2: Extract Session ID from JWT...
✓ Session ID: 3A96BE7F62B7EAAC5F873F8F9966BF...

Step 3: Get Numeric User/Org IDs...
✓ User ID: 990021049
✓ Org ID: 990000459

Step 4: Test API Call - GET /Projects...
✓ Retrieved 50 projects

✅ ALL TESTS PASSED!

Authentication Details:
  User ID (numeric): 990021049
  Org ID: 990000459
  Session ID: Present
  Access Token: Valid
```

---

## Key Takeaways

1. **Always use `https://api.filevineapp.com/fv-app/v2`** as the base URL
2. **Extract three pieces of auth data**:
   - Access Token (from OAuth)
   - Session ID (from JWT `jti` claim)
   - Numeric User ID (from `GetUserOrgsWithToken`)
3. **Include all three custom headers** in every API request
4. **Use PascalCase** for all endpoint names
5. **Don't trust the public documentation** - it's missing critical requirements

---

## Additional Resources

- **Filevine OAuth Docs**: https://developer.filevine.io/docs/v2-ca/branches/main/e0f5ad7e2c916-authentication
- **API Reference**: https://developer.filevine.io/docs/v2-ca/
- **React Native Implementation Example**: See `FILEVINE_API_INTEGRATION_DOCUMENTATION.md` for a production implementation

---

## Support

This implementation was validated against Filevine API v2 as of October 2025. If you encounter issues:

1. Verify all three credentials are correct (Client ID, Client Secret, PAT)
2. Confirm you're using the correct base URL
3. Check that all three custom headers are included
4. Verify endpoint names use PascalCase
5. Ensure you're using the numeric user ID, not the JWT UUID

---

**Created**: October 2025  
**Last Validated**: October 17, 2025  
**API Version**: Filevine v2

