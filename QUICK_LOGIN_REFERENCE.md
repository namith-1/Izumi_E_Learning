# 🔑 ADMIN LOGIN - QUICK REFERENCE

## Login Credentials
```
Email:    admin@example.com
Password: admin123456
```

## Test URL
```
http://localhost:3000/admin/login
```

## Expected Behavior
1. Enter credentials above
2. Click "Login"
3. Should redirect to `/admin/dashboard`
4. No error messages in console
5. Stays logged in after refresh

## Browser DevTools Checks

### Console Tab
Look for these logs (in order):
```
[API] POST /admin/auth/login
[Redux] Login successful...
[AdminLogin] Authenticated, redirecting to dashboard
```

### Network Tab
- Request URL: `http://localhost:3000/admin/auth/login` (proxied to 4000)
- Status: `200 OK`
- Response contains: `{"message":"Login successful","admin":{...}}`
- Response Headers has: `Set-Cookie: connect.sid=...`

### Application Tab → Cookies
- Should see `connect.sid` cookie with value like: `s%3AFTm6DTOOokXpSyYfl9JbbG4Lm1J4DlOk.BIc9r7tomSjFNY%2Bo4dWJ7kCgkQeFc9upFLnR%2BXeDlE4`

### Application Tab → Local Storage
- Key: `admin`
- Value: `{"_id":"692dfe1f02eab9f0b6a2c065","name":"System Administrator",...}`

## If Login Fails

### ❌ "Invalid email or password"
- **Check**: Is backend running on port 4000?
- **Check**: Is MongoDB connected?
- **Check**: Admin account exists? Run: `node scripts/createAdminAccount.js`

### ❌ "Network Error" or CORS Error
- **Check**: CORS configured with `credentials: true`? (`server.js` line ~16)
- **Check**: `package.json` has `"proxy": "http://localhost:4000"`? (in client folder)
- **Check**: React app restarted after package.json change?

### ❌ Session 401 Errors
- **Check**: `/admin/auth/login` returns 200? (Test with curl)
- **Check**: Session cookie being set? (DevTools → Cookies → connect.sid)
- **Check**: `req.session.save()` in controller? (`adminAuthController.js`)

### ❌ "Maximum update depth exceeded"
- **Check**: AdminLogin.jsx has correct useEffect deps? (Should be just `[error]`)
- **Check**: No infinite loops in error handling?

## Curl Test Commands

### Test Login
```bash
curl -X POST http://localhost:4000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123456"}' \
  -c cookies.txt
```

### Test Session Persistence
```bash
curl -X GET http://localhost:4000/admin/auth/me \
  -b cookies.txt
```

### Expected Responses

**Login (200 OK)**:
```json
{
  "message": "Login successful",
  "admin": {
    "_id": "692dfe1f02eab9f0b6a2c065",
    "name": "System Administrator",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**Session Check (200 OK)**:
```json
{
  "_id": "692dfe1f02eab9f0b6a2c065",
  "name": "System Administrator",
  "email": "admin@example.com",
  "role": "admin",
  "created_at": "2025-12-01T20:44:15.753Z"
}
```

## Database Connection

**MongoDB Status**: ✅ Connected  
**Admin Record**: ✅ Exists  
**Collection**: `admins`  
**Document Count**: 1

## Server Status

| Service | Port | Status |
|---------|------|--------|
| Backend (Node) | 4000 | ✅ Running |
| Frontend (React) | 3000 | ✅ Running |
| MongoDB | N/A | ✅ Connected |

## Common Ports

```
Frontend:  http://localhost:3000
Backend:   http://localhost:4000
Admin:     http://localhost:3000/admin/login
Dashboard: http://localhost:3000/admin/dashboard
```

## Recovery

### Clear Login State
1. Open DevTools → Application
2. Clear Cookies (find `connect.sid`)
3. Clear Local Storage (find `admin`)
4. Refresh page
5. Login again

### Restart Backend
```bash
# Kill process
taskkill /PID <process_id> /F

# Or stop all Node
Get-Process node | Stop-Process -Force

# Restart
cd Izumi_E_Learning
npm start  # or node server.js
```

### Reset Admin Account
```bash
# Delete and recreate
node scripts/createAdminAccount.js
```

---

**All Systems Operational! ✅**
