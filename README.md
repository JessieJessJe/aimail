# Newsly - AI-Powered Email Newsletter Agent

An AI-powered email newsletter agent that works like a personalized WSJ daily briefing for HackerNews, featuring a conversational feedback loop with users.

## Features

### Admin Dashboard
- **User Management**: View all registered users in a clean table interface
- **Edit Spec Modal**: Customize user preferences and newsletter specifications
- **Preview Newsletter**: See how the newsletter will look before sending
- **Send Newsletter**: Dispatch personalized newsletters to individual users
- **Add Users**: Register new users with email and optional name

### User Interaction Workflow
1. Users receive personalized HackerNews briefings via email
2. Users can reply with natural language to:
   - **Customize preferences**: "More on EU regs, less crypto, send at 8am"
   - **Ask follow-up questions**: "Why does that change matter for reinsurers?"
3. System responds via email and updates user specifications
4. Admin can review changes and resend updated newsletters

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **UI Components**: Radix UI + Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Email**: Nodemailer (configured for production)
- **AI Integration**: Ready for CoreSpeed + Zypher agent
- **Data Feed**: Prepared for HackerNews MCP server

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Deno (for Zypher Agent integration)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd newsly
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your actual API keys and configuration:
   - `ANTHROPIC_API_KEY`: Get from [Anthropic Console](https://console.anthropic.com/)
   - `DATABASE_URL`: Your database connection string
   - Email configuration for newsletter sending

5. **Run the development server**:
   ```bash
   npm run dev
   ```

### Security Notes

⚠️ **Important**: Never commit sensitive information to your repository!

- All `.env*` files (except `.env.example`) are automatically ignored by git
- API keys, database credentials, and other secrets are excluded from version control
- Use the provided `.env.example` as a template for required environment variables
- For production deployment, set environment variables through your hosting platform's dashboard

4. **Open the application**:
   Visit [http://localhost:3000](http://localhost:3000)

## Database Schema

### Users Table
- `id`: Unique identifier
- `email`: User email address (unique)
- `name`: Optional user name
- `spec`: JSON specification for newsletter preferences
- `createdAt`/`updatedAt`: Timestamps

### Newsletters Table
- `id`: Unique identifier
- `userId`: Reference to user
- `subject`: Email subject line
- `content`: HTML email content
- `sentAt`: Timestamp when sent

## User Specification Format

The `spec` field stores user preferences as JSON:

```json
{
  "preferences": {
    "topics": ["technology", "startups", "programming"],
    "excludeTopics": ["crypto"],
    "sendTime": "09:00",
    "timezone": "UTC",
    "frequency": "daily"
  },
  "tone": "professional",
  "length": "medium",
  "includeAnalysis": true
}
```

## API Endpoints

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/[id]` - Update user spec
- `DELETE /api/users/[id]` - Delete user

### Newsletter
- `POST /api/send-newsletter` - Send newsletter to specific user

## Development Status

### ✅ Completed
- [x] Project setup with Next.js, TypeScript, Prisma
- [x] Admin dashboard with user table
- [x] Edit Spec modal for user preferences
- [x] Preview Newsletter modal
- [x] Send newsletter functionality (mock)
- [x] Database schema and API routes
- [x] Responsive UI with Tailwind CSS

### 🚧 Next Steps
- [ ] Email processing system for user replies
- [ ] CoreSpeed + Zypher agent integration
- [ ] HackerNews MCP server connection
- [ ] Natural language spec updating
- [ ] Production email configuration

## Demo Data

The application includes three sample users:
- **john.doe@example.com**: Tech/AI focused, 8am delivery
- **jane.smith@example.com**: Programming focused, excludes crypto, 9:30am
- **alex.johnson@example.com**: Security/blockchain focused, 7am delivery
