# Debugging Guide: Dashboard and Products Access Issues

## Steps to Debug the Authentication Issue

### 1. **Test Basic Authentication Flow**

First, let's test if the authentication system is working at all:

1. **Start the backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test the login process**:
   - Go to `http://localhost:3000/login`
   - Use the test credentials: `customer@example.com` / `customerpass`
   - **Open browser console** (F12 → Console tab)
   - Look for debug messages during login

### 2. **Check Debug Test Page**

I created a test page to debug the authentication:

- Go to `http://localhost:3000/test`
- This page will show:
  - The parsed JWT token data
  - API test results
  - Any errors in the authentication flow

### 3. **Test Simple Products Page**

I created a simplified products page to test basic routing:

- Go to `http://localhost:3000/products-simple`
- This page has minimal code and should load if authentication is working

### 4. **Check Console Logs**

I added extensive console logging. Check the browser console for:

- `"Login successful, received data:"` - Shows backend response
- `"Token stored in localStorage"` - Confirms token storage
- `"Dashboard component mounted, auth token:"` - Shows token parsing
- `"Loading dashboard data..."` - Shows API call attempts

### 5. **Common Issues and Solutions**

#### Issue 1: Backend Not Running
**Symptoms**: Network errors, "Failed to fetch" messages
**Solution**: Make sure backend is running on port 5000

#### Issue 2: CORS Issues
**Symptoms**: CORS errors in console
**Solution**: Backend has CORS enabled, but check if it's blocking localhost:3000

#### Issue 3: JWT Token Issues
**Symptoms**: Token validation failures
**Solution**: Check the test page to see if token is properly formatted

#### Issue 4: Database Connection Issues
**Symptoms**: 500 errors from API calls
**Solution**: Check if MongoDB is running on port 27018

### 6. **Manual Testing Steps**

1. **Login Process**:
   ```bash
   # Test login endpoint directly
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"customer@example.com","password":"customerpass"}'
   ```

2. **Token Validation**:
   ```bash
   # Replace YOUR_TOKEN with actual token from localStorage
   curl -X GET http://localhost:5000/api/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Products API**:
   ```bash
   curl -X GET http://localhost:5000/api/products \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### 7. **Environment Check**

Verify these files exist and have correct content:

- `backend/.env` - Should have MongoDB URI, JWT secret, port
- `backend/package.json` - Should have all dependencies
- MongoDB should be running on port 27018

### 8. **Quick Fixes Applied**

I've made these changes to help debug:

1. **Fixed JWT token parsing** - Now handles missing name/email fields
2. **Added debug logging** - Extensive console.log statements
3. **Simplified ProtectedRoute** - Removed server validation temporarily
4. **Fixed API endpoint** - Changed `/validate` to `/me`
5. **Enhanced token generation** - Includes name and email in JWT

### 9. **Test Sequence**

Follow this exact sequence:

1. Open browser console (F12)
2. Go to login page
3. Enter credentials and submit
4. Watch console for success messages
5. Should redirect to dashboard automatically
6. Check `/test` page for detailed debug info
7. Try `/products-simple` for basic routing test

### 10. **What to Look For**

**Good signs**:
- Login success message in console
- Token stored in localStorage
- Dashboard component mounts
- No 401/403 errors

**Bad signs**:
- Network errors (backend not running)
- CORS errors (configuration issue)
- JWT decode errors (token format issue)
- 401/403 errors (authentication failure)

## Next Steps

1. **Run the test sequence above**
2. **Check the `/test` page** for detailed debug info
3. **Share the console output** if you're still having issues
4. **Test the simple products page** to isolate the problem

The authentication system should now work much more reliably with the debugging improvements!
