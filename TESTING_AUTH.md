# Testing Admin Authentication

## Prerequisites

1. ✅ Backend running on `http://localhost:4000`
2. ✅ React frontend running on `http://localhost:3000`
3. ✅ MongoDB connected
4. ✅ Admin account created

## Admin Credentials

```
Email: admin@example.com
Password: admin123456
```

## Testing Steps

### 1. Test Backend Directly (No UI)

```powershell
# Test login endpoint
$body = @{email="admin@example.com";password="admin123456"} | ConvertTo-Json
$result = Invoke-WebRequest -Uri "http://localhost:4000/admin/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body `
  -SessionVariable session

# Should return: 200 OK with admin details

# Test session persistence
Invoke-WebRequest -Uri "http://localhost:4000/admin/auth/me" `
  -WebSession $session

# Should return: 200 OK with admin profile
```

### 2. Test From Browser

1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to: `http://localhost:3000/admin/login`
4. Enter credentials:
   - Email: `admin@example.com`
   - Password: `admin123456`
5. Click Login

**Expected logs in console:**
```
[API] POST /admin/auth/login
[API] Response (200): {message: "Login successful", admin: {...}}
[Redux] Attempting admin login with: {email: "admin@example.com"}
[Redux] Login successful, response: {message: "Login successful", admin: {...}}
```

6. Should redirect to `/admin/dashboard` without errors

### 3. Check Browser Cookies

1. Open DevTools Network tab
2. Look at request to `/admin/auth/login`
3. Check "Response Headers" for `Set-Cookie`
4. Should see: `connect.sid=...`
5. Check "Cookies" tab to verify `connect.sid` is stored

### 4. Verify Session Persistence

1. Stay on dashboard
2. Open browser Console
3. Type:
   ```javascript
   fetch('/admin/auth/me', {credentials: 'include'})
     .then(r => r.json())
     .then(d => console.log('Session valid:', d))
   ```
4. Should see admin profile data

## Common Issues & Solutions

### Issue: "GET http://localhost:3000/api/auth/me 401"
**Cause:** Wrong endpoint - this is for student auth, not admin  
**Solution:** Admin uses `/admin/auth` endpoints

### Issue: "POST http://localhost:3000/admin/auth/login 400"
**Cause:** Missing admin account or wrong credentials  
**Solution:** 
```bash
cd Izumi_E_Learning
node scripts/createAdminAccount.js
```

### Issue: "POST http://localhost:3000/admin/auth/login 403"
**Cause:** CORS issue or session not persisting  
**Solution:**
1. Check browser console for CORS errors
2. Verify `package.json` has `"proxy": "http://localhost:4000"`
3. Check cookies are being sent (`withCredentials: true`)

### Issue: Session lost on page refresh
**Cause:** Client session store not initialized or cookies not persisted  
**Solution:**
1. Check DevTools Cookies for `connect.sid`
2. Verify `httpOnly: true` is set (can't see but should work)
3. Check server logs for session errors

## Debugging Commands

### View database admin record
```javascript
// In MongoDB shell or Compass
db.admins.findOne({email: "admin@example.com"})
```

### Clear session store (if using memory)
- Restart backend server
- Clients will be logged out

### Check server logs
```bash
# Should see:
# ✅ Connected to MongoDB
# [CORS] Validating origin...
# Session saved successfully
```

### Test with curl
```bash
curl -X POST http://localhost:4000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123456"}' \
  -c cookies.txt

curl -X GET http://localhost:4000/admin/auth/me \
  -b cookies.txt
```

## Files Modified

1. ✅ `server.js` - CORS + Session config
2. ✅ `controllers/adminAuthController.js` - Session persistence
3. ✅ `client/src/services/adminAuthApi.js` - Debugging + error handling
4. ✅ `client/src/redux/slices/authSlice.js` - Logging for debugging
5. ✅ `scripts/createAdminAccount.js` - Fixed path

## Next Steps If Still Failing

1. Check browser DevTools Console for error messages
2. Check backend server logs (`npm start` output)
3. Verify MongoDB is running and has admin record
4. Try different browser/incognito mode (clear cache)
5. Check firewall isn't blocking localhost:4000
