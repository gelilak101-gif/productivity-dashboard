# Google Calendar + Morning Briefing Setup

## Step 1: Google Calendar Setup

### Create a Google Cloud Project
1. Go to https://console.cloud.google.com
2. Click "Select a project" → "New Project"
3. Name it "My Dashboard" → Create

### Enable the Calendar API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click it → "Enable"

### Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the consent screen first:
   - User Type: External
   - App name: My Dashboard
   - Your email for support and developer fields
   - Save and continue through all steps
4. Back at Create Credentials → OAuth client ID:
   - Application type: **Web application**
   - Name: My Dashboard
   - Authorized redirect URIs: add EXACTLY this:
     `http://localhost:3000/api/auth/google/callback`
   - Click Create
5. Copy your **Client ID** and **Client Secret**

### Add to .env.local
Open your .env.local file and add:
```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Connect in the Dashboard
1. Restart your dev server
2. You'll see a "Connect Google Calendar" button on the dashboard
3. Click it and sign in with Google
4. You'll be redirected back and your events will appear

---

## Step 2: Morning Briefing via iMessage (Mac + iPhone)

### Install Claude Cowork
1. Download Claude Cowork from the Anthropic website
2. Sign in with your Anthropic account

### Create the Scheduled Task
In Cowork, create a new scheduled task with these settings:

**Schedule:** Daily at 8:30 AM

**Instructions:**
```
Every morning at 8:30 AM, do the following:

1. Fetch my dashboard briefing by making a GET request to:
   http://localhost:3000/api/briefing

2. The response will have a "message" field with my daily briefing text.

3. Send that message to my iPhone via iMessage to: [YOUR PHONE NUMBER]

That's it — just fetch and send the message every morning.
```

### Keep your Mac on overnight
Go to System Settings → Battery → Options → turn on "Prevent automatic sleeping when the display is off"

That's it! You'll get a text every morning at 8:30 AM with your tasks, calendar events, and weekly focus.

---

## For Vercel Deployment
When you deploy to Vercel, add these environment variables in your Vercel dashboard:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET  
- GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/google/callback

Then update your Google OAuth redirect URI to match your Vercel URL.
