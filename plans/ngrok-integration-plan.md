# Ngrok Integration Plan for Next.js App

## Overview

This plan outlines how to expose your Next.js application to the internet using ngrok, while keeping the Python server local-only. The Next.js app will act as a gateway, proxying requests to the Python server on localhost:8000.

## Current Architecture

```
┌─────────────────┐
│   Browser       │
│   (Local)       │
└────────┬────────┘
         │
         │ http://localhost:3000
         ▼
┌─────────────────┐
│   Next.js App   │
│   (Port 3000)   │
│                 │
│  ┌───────────┐  │
│  │ API Routes│  │
│  └─────┬─────┘  │
        │         │
        │ http://localhost:8000
        ▼         │
┌─────────────────┐│
│  Python Server  ││
│  (Port 8000)    ││
└─────────────────┘│
                   │
                   │ (External APIs: YouTube, OpenRouter, etc.)
                   ▼
              ┌──────────┐
              │ Internet │
              └──────────┘
```

## Proposed Architecture with Ngrok

```
┌─────────────────┐
│   Browser       │
│   (Anywhere)    │
└────────┬────────┘
         │
         │ https://your-app.ngrok-free.app
         ▼
┌─────────────────┐
│   Ngrok Tunnel  │
└────────┬────────┘
         │
         │ http://localhost:3000
         ▼
┌─────────────────┐
│   Next.js App   │
│   (Port 3000)   │
│                 │
│  ┌───────────┐  │
│  │ API Routes│  │
│  └─────┬─────┘  │
        │         │
        │ http://localhost:8000
        ▼         │
┌─────────────────┐│
│  Python Server  ││
│  (Port 8000)    ││
│  (Local Only)   ││
└─────────────────┘│
                   │
                   │ (External APIs)
                   ▼
              ┌──────────┐
              │ Internet │
              └──────────┘
```

## Key Benefits

1. **Security**: Python server remains accessible only from localhost
2. **Simplicity**: Single ngrok tunnel for the entire Next.js app
3. **Flexibility**: Easy to enable/disable internet access
4. **Testing**: Perfect for sharing work-in-progress with others
5. **No Code Changes Required**: Next.js API routes already proxy to Python server

## Implementation Steps

### Step 1: Install Ngrok

```bash
# Windows (using Chocolatey)
choco install ngrok

# Or download from https://ngrok.com/download
# Extract and add to PATH
```

### Step 2: Authenticate Ngrok (Optional but Recommended)

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 3: Start Your Services

**Terminal 1 - Start Python Server:**

```bash
# Navigate to your Python server directory
cd path/to/python/server
python server.py  # or whatever command starts it
```

**Terminal 2 - Start Next.js App:**

```bash
# Navigate to your Next.js project
cd c:/Users/user/Documents/Coding/yt-captions
npm run dev
```

### Step 4: Create Ngrok Tunnel

**Terminal 3 - Start Ngrok:**

```bash
ngrok http 3000
```

This will output:

```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

### Step 5: Access Your App

Share the ngrok URL (e.g., `https://abc123.ngrok-free.app`) with anyone who needs to access your app.

## Advanced Configuration Options

### Option A: Custom Subdomain (Paid Feature)

```bash
ngrok http 3000 --domain=my-app.ngrok-free.app
```

### Option B: Basic Authentication

```bash
ngrok http 3000 --basic-auth="username:password"
```

### Option C: Inspect Traffic

```bash
ngrok http 3000 --log=stdout
```

### Option D: Config File (Recommended for Repeated Use)

Create `ngrok.yml`:

```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN

tunnels:
  nextjs-app:
    addr: 3000
    proto: http
    bind_tls: true
    inspect: true
    # Optional: basic_auth:
    #   - "username:password"
```

Run with config:

```bash
ngrok start nextjs-app
```

## Environment Variables Considerations

Your app uses several environment variables. When exposing via ngrok:

1. **Supabase URLs/Keys**: These are safe to use as they're already public in client-side code
2. **API Keys (YouTube, OpenRouter, DeepSeek)**: These remain secure as they're only used server-side
3. **No changes needed**: Your current `.env` setup works perfectly with ngrok

## Security Considerations

### ⚠️ Important Security Notes

1. **Public Access**: Anyone with the ngrok URL can access your app
2. **No Authentication**: Consider adding authentication if needed
3. **Rate Limiting**: Free ngrok account has connection limits
4. **Temporary URLs**: Free ngrok URLs change on restart (unless using paid plan)
5. **Data Privacy**: Be careful about what data you expose

### Recommended Security Enhancements

1. **Add Authentication to Next.js**:

   - You already have Supabase auth (sign-in/sign-up pages)
   - Ensure all protected routes require authentication

2. **Use Ngrok Basic Auth**:

   ```bash
   ngrok http 3000 --basic-auth="your-username:your-password"
   ```

3. **Restrict Access by IP** (Enterprise feature):

   - Only allow specific IP addresses to access

4. **Monitor Traffic**:
   - Use ngrok's web dashboard to inspect requests
   - Check logs for suspicious activity

## Testing Checklist

- [ ] Python server running on port 8000
- [ ] Next.js app running on port 3000
- [ ] Ngrok tunnel created and forwarding to port 3000
- [ ] Access app via ngrok URL from different device/network
- [ ] Test transcript API (calls Python server through Next.js)
- [ ] Test YouTube metadata API (external API)
- [ ] Test authentication flow (sign in/sign up)
- [ ] Verify all Supabase features work
- [ ] Test from mobile device
- [ ] Share URL with a colleague for testing

## Troubleshooting

### Issue: "Connection Refused"

- **Cause**: Next.js app not running
- **Solution**: Ensure `npm run dev` is running in Terminal 2

### Issue: "Failed to fetch transcript"

- **Cause**: Python server not running
- **Solution**: Ensure Python server is running on port 8000

### Issue: Ngrok URL doesn't work

- **Cause**: Ngrok tunnel not active
- **Solution**: Check ngrok terminal, ensure it shows "Forwarding" status

### Issue: Mixed Content Warnings

- **Cause**: Loading HTTP resources on HTTPS page
- **Solution**: Ensure all external APIs use HTTPS (they already do)

## Alternative: Cloud Deployment (For Production)

While ngrok is great for development/testing, consider these for production:

1. **Vercel** (Recommended for Next.js)

   - Free tier available
   - Automatic deployments
   - Edge functions

2. **Railway/Render/Fly.io**

   - Host both Next.js and Python server
   - Managed databases

3. **AWS/Google Cloud/Azure**
   - Full control
   - Scalable
   - More complex setup

## Next Steps

1. Install ngrok on your machine
2. Test the setup locally
3. Verify all features work through ngrok
4. Consider security enhancements based on your use case
5. Document your ngrok URL for easy sharing
6. Set up monitoring if needed

## Files to Review

No code changes required! Your current setup is ngrok-ready:

- [`app/api/transcript/route.ts`](../app/api/transcript/route.ts:11) - Already proxies to localhost:8000
- [`package.json`](../package.json:4) - Dev script ready (`npm run dev`)
- [`.env.example`](../.env.example:1) - Environment variables configured

## Summary

Your Next.js app is already perfectly set up for ngrok exposure. The architecture where Next.js API routes proxy requests to the Python server on localhost:8000 means you only need one ngrok tunnel pointing to port 3000. This keeps your Python server secure (local-only) while allowing external access to your full application through the Next.js gateway.
