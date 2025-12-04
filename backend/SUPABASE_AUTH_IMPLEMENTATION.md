# Supabase Auth Implementation Guide

## Overview
This backend now uses **Supabase Auth** for authentication instead of custom JWT + bcrypt + SendGrid email verification. All authentication operations (signup, login, email verification, password reset) are handled by Supabase.

## What Changed

### 1. **Removed Dependencies**
- ❌ SendGrid email service (no longer needed)
- ❌ Custom JWT token generation with `jsonwebtoken`
- ❌ Manual email verification tokens
- ❌ Manual password reset tokens (OTP system)
- ❌ bcrypt password hashing (Supabase handles this)

### 2. **New Dependencies**
- ✅ `@supabase/supabase-js` - Already installed
- ✅ Supabase Admin client for server-side operations

### 3. **Database Changes**
Removed the following Prisma models:
- `VerificationToken`
- `PasswordResetToken`

The `User` model now:
- Uses Supabase user IDs (UUID)
- `password` field is empty (managed by Supabase)
- `isVerified` is synced with Supabase email confirmation

### 4. **Authentication Flow**

#### **Registration** (`POST /users/register`)
1. User submits: `fullname`, `email`, `password`, `role`
2. Backend creates user in **Supabase Auth** with `admin.createUser()`
3. Backend creates corresponding user in **Prisma database**
4. Supabase automatically sends **email verification** link
5. User verifies email through Supabase's built-in flow

#### **Login** (`POST /users/login`)
1. User submits: `email`, `password`
2. Backend calls `supabaseAdmin.auth.signInWithPassword()`
3. Supabase validates credentials and returns JWT token
4. Backend checks if email is verified
5. Backend syncs user data between Supabase and Prisma
6. JWT token is stored in **HTTP-only cookie** (`authToken`)

#### **Password Reset** (`POST /users/request-password-reset`)
1. User submits: `email`
2. Backend calls `supabaseAdmin.auth.resetPasswordForEmail()`
3. Supabase sends **password reset email** with magic link
4. User clicks link and is redirected to frontend reset page
5. User submits new password via `POST /users/reset-password`

#### **Logout** (`POST /users/logout`)
1. Backend signs out from Supabase
2. Clears HTTP-only cookie

### 5. **Middleware Changes**
The `authenticate` middleware now:
- Extracts JWT from cookie or `Authorization` header
- Calls `supabaseAdmin.auth.getUser(token)` to verify token
- Attaches user info (`id`, `email`, `role`) to `req.user` and `req.userId`

---

## Environment Variables

Update your `.env` file:

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_URL="https://your-project.supabase.co"

# JWT Secret (get from Supabase Dashboard > Settings > API)
JWT_SECRET="your-supabase-jwt-secret"

# Frontend URL for redirects
FRONTEND_URL="http://localhost:5173"

# Redis
REDIS_URL="rediss://..."

# Remove these (no longer needed):
# SENDGRID_API_KEY=""
# FROM_EMAIL=""
```

**Note:** You can find your JWT secret in the Supabase Dashboard:
1. Go to **Settings** → **API**
2. Copy the **JWT Secret** under "Project API keys"

---

## Migration Steps

### Step 1: Update Database Schema
Run Prisma migration to remove token tables:

```bash
cd backend
npx prisma migrate dev --name remove_token_tables
```

### Step 2: Configure Supabase Email Templates (Important!)

Go to your Supabase Dashboard:

1. **Authentication** → **Email Templates**
2. Configure the following templates:

   **Confirm Signup:**
   - Subject: `Verify your email for Scholarship Finder`
   - Redirect URL: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`

   **Reset Password:**
   - Subject: `Reset your password for Scholarship Finder`
   - Redirect URL: `{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery`

3. **Authentication** → **URL Configuration**
   - Site URL: `http://localhost:5173` (dev) or your production URL
   - Redirect URLs: Add `http://localhost:5173/*` and your production URLs

### Step 3: Install Dependencies (if needed)
```bash
npm install
```

### Step 4: Start the Server
```bash
npm run dev
```

You should see:
```
✅ Supabase Admin client initialized
Server is running on port 3000
Using Supabase Auth for authentication
```

---

## Testing the Implementation

### 1. **Test Registration**
```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "role": "STUDENT"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "fullname": "John Doe",
    "role": "STUDENT"
  }
}
```

**Check your email** for the verification link from Supabase.

### 2. **Verify Email**
Click the verification link in the email. It should redirect to your frontend.

### 3. **Test Login**
```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "fullname": "John Doe",
    "role": "STUDENT"
  },
  "message": "Login successful",
  "token": "eyJhbGc..." // Only in development
}
```

### 4. **Test Protected Route**
```bash
curl http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. **Test Password Reset**
```bash
curl -X POST http://localhost:3000/users/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
```

Check your email for the password reset link from Supabase.

---

## Frontend Integration

Update your frontend to:

1. **Remove** custom email verification pages (Supabase handles this)
2. **Update** login/register API calls to match new response format
3. **Handle** Supabase redirect URLs for email verification and password reset
4. Store JWT token from cookies or response body
5. Update password reset flow to use Supabase magic links

Example frontend auth flow:

```typescript
// Register
const register = async (fullname: string, email: string, password: string, role: string) => {
  const response = await fetch('http://localhost:3000/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullname, email, password, role }),
    credentials: 'include' // Important for cookies
  });
  return response.json();
};

// Login
const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:3000/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include'
  });
  return response.json();
};
```

---

## Troubleshooting

### Issue: "Email not verified" error on login
**Solution:** Make sure the user clicked the verification link sent by Supabase. Check your email spam folder.

### Issue: "Invalid credentials" on login
**Solution:** 
- Verify the email/password are correct
- Check if user exists in both Supabase Auth and Prisma database
- Try resetting the password

### Issue: Emails not being sent
**Solution:**
- Check Supabase Dashboard → **Authentication** → **Email Templates**
- Verify SMTP settings in Supabase (default uses Supabase's SMTP)
- For production, configure custom SMTP in Supabase settings

### Issue: JWT verification fails
**Solution:**
- Verify `JWT_SECRET` in `.env` matches Supabase Dashboard
- Check token hasn't expired (default: 1 hour)
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct

---

## Security Notes

1. ✅ **Passwords** are securely hashed by Supabase (bcrypt)
2. ✅ **JWT tokens** are signed and verified by Supabase
3. ✅ **HTTP-only cookies** prevent XSS attacks
4. ✅ **Email verification** prevents fake accounts
5. ✅ **Rate limiting** should be enabled on auth endpoints
6. ⚠️ Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
7. ⚠️ Use `SUPABASE_ANON_KEY` for frontend Supabase client

---

## Benefits of Supabase Auth

✅ Built-in email verification (no SendGrid needed)  
✅ Built-in password reset flow  
✅ Secure password hashing (bcrypt)  
✅ JWT token management  
✅ OAuth providers ready (Google, GitHub, etc.)  
✅ Session management  
✅ Rate limiting on auth endpoints  
✅ Email templates customization  
✅ Magic link authentication  
✅ Multi-factor authentication (MFA) support  

---

## Next Steps

1. ✅ Test all auth flows (register, login, password reset)
2. ✅ Update frontend to use new auth endpoints
3. ✅ Customize Supabase email templates
4. ✅ Configure production URLs in Supabase
5. ⏳ Optional: Add OAuth providers (Google, GitHub)
6. ⏳ Optional: Enable MFA for enhanced security
7. ⏳ Deploy and test in production

---

## Support

For Supabase Auth documentation:
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Auth Server-Side](https://supabase.com/docs/guides/auth/server-side)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

---

**Implementation completed! 🎉**
