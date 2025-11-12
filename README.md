# Nexus Ventures Mileage Form

A professional business mileage logbook application for Irish employees and directors with serverless email functionality.

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

This project includes serverless functions for email sending via Resend.

#### Deploy to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Environment Variables on Vercel:
Set the following in your Vercel project settings:
- `RESEND_API_KEY`: Your Resend API key

## 📡 Serverless Email Function

The application includes a Vercel serverless function (`api/send-email.ts`) that:

1. **Receives form data** from the frontend
2. **Generates PDF** server-side (optional)
3. **Sends email** via Resend API with PDF attachment
4. **Returns success/error** response

### Function Features:
- **Type-safe**: Written in TypeScript
- **Error handling**: Comprehensive error responses
- **Security**: API key stored securely in environment variables
- **Attachments**: PDF files attached to emails
- **Validation**: Input validation for required fields

### Email Templates:
- **Expense Reports**: Professional expense report notifications
- **Mileage Logbooks**: Business mileage logbook submissions

### Option 2: Docker (removed)
> Note: Docker deployment files and instructions have been removed from this repository.

The recommended deployment path remains Vercel (see Option 1 above) or any platform that supports Node/Vercel-style deployments. For local full-stack development, use the included Express server:

```bash
# Start the email server (in one terminal)
npm run server

# Start the frontend (in another terminal)
npm run dev
```

### Option 3: Traditional Hosting

Use your preferred static hosting provider or follow the build steps above to publish the site.

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key_here

# Application Configuration
NODE_ENV=production
```

## 🛠️ Technologies Used

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js server for email functionality
- **UI**: shadcn/ui + Tailwind CSS
- **Email**: Resend API
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Deployment**: Vercel (serverless) + Node.js/Express

## 📦 Local Development

### Frontend Only (Development)
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Full Stack Development (with Email Server)
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Resend API key

# Start the email server (in one terminal)
npm run server

# Start the frontend (in another terminal)
npm run dev
```

### Testing Email Functionality
1. Start the email server: `npm run server`
2. Start the frontend: `npm run dev`
3. Fill out and submit a form
4. Check the email server console for success/error messages
5. Verify emails are received at the configured address

## 🔒 Security Notes

- Email sending is handled server-side via Vercel serverless functions to prevent API key exposure
- The Resend API key is securely stored as an environment variable in Vercel
- PDF generation happens client-side for immediate user feedback
- All sensitive operations are performed on the server via serverless functions

## 📄 License

This project is private and proprietary to Nexus Ventures.
