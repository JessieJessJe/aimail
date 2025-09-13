# Email Setup Guide

This guide explains how to set up the email functionality for the newsletter system with Claude AI responses.

## 1. Gmail Configuration

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password
1. In Google Account settings > Security
2. Click on "App passwords"
3. Select "Mail" as the app
4. Generate a 16-character app password
5. Copy this password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update Environment Variables
In your `.env.local` file, update:
```
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=abcdefghijklmnop  # Remove spaces from app password
EMAIL_FROM=your_gmail@gmail.com
```

## 2. Email Reply Handling

The system includes an API endpoint at `/api/email-reply` that can process incoming emails and respond with Claude AI.

### Current Setup (Manual Testing)
For now, the system sends emails to `onejessiehan@gmail.com` and you can manually test replies by:

1. Send a newsletter using the admin dashboard
2. Check the email at `onejessiehan@gmail.com`
3. To simulate a reply, you can manually call the API:

```bash
curl -X POST http://localhost:3000/api/email-reply \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onejessiehan@gmail.com",
    "subject": "Re: Your Newsletter",
    "text": "I found the AI article really interesting. Can you tell me more about GPT-5?",
    "messageId": "test-123"
  }'
```

### Production Setup (Email Webhooks)

For production, you'll need to set up email webhooks with a service like:

#### Option 1: SendGrid Inbound Parse
1. Sign up for SendGrid
2. Configure Inbound Parse webhook
3. Point it to `https://yourdomain.com/api/email-reply`
4. Update your MX records

#### Option 2: Mailgun Routes
1. Sign up for Mailgun
2. Set up a route for incoming emails
3. Configure webhook to `https://yourdomain.com/api/email-reply`

#### Option 3: Gmail API (Advanced)
1. Set up Gmail API credentials
2. Use Gmail Push notifications
3. Process emails via Gmail API

## 3. Testing the System

### Test Email Sending
1. Start the development server: `npm run dev`
2. Open the admin dashboard at `http://localhost:3000`
3. Click "Send Newsletter" for a user
4. Check that the email arrives at `onejessiehan@gmail.com`

### Test Claude Responses
1. Use the curl command above to simulate an email reply
2. Check the console logs for Claude's response
3. Verify that a reply email is sent back

## 4. Features

### Newsletter Features
- ✅ Personalized content based on user preferences
- ✅ Professional HTML email formatting
- ✅ Reply instructions included in emails
- ✅ Rate limiting for API calls

### Reply Features
- ✅ Automatic email content cleaning (removes quotes, signatures)
- ✅ Claude AI integration for intelligent responses
- ✅ Proper email threading with In-Reply-To headers
- ✅ Error handling and fallback responses
- ✅ Conversation logging for analytics

## 5. Security Notes

- Never commit your `.env.local` file to version control
- Use App Passwords, not regular Gmail passwords
- The system only sends to `onejessiehan@gmail.com` for testing
- All email credentials are stored securely in environment variables

## 6. Troubleshooting

### Email Not Sending
- Check that all EMAIL_* environment variables are set
- Verify the app password is correct (16 characters, no spaces)
- Check console logs for specific error messages

### Claude Not Responding
- Verify ANTHROPIC_API_KEY is set correctly
- Check rate limiting (5 calls per minute)
- Review console logs for API errors

### Email Replies Not Working
- Ensure the webhook endpoint is accessible
- Check that the email service is configured correctly
- Verify the API endpoint format matches your email service