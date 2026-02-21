# Server (Express + TypeScript)

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB instance
- Firebase project with Admin SDK credentials
- Gmail account with App Password (for email functionality)

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials:

- `MONGODB_URI`: Your MongoDB connection string
- `FIREBASE_API_KEY`: Firebase project API key
- `JWT_SECRET`: Random secure string for JWT signing
- `ADMIN_SECRET`: Random secure string for admin authentication
- `SMTP_USER` & `SMTP_PASS`: Your email and app password

### 3. Firebase Service Account Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file as `src/config/firebase-service-account.json`

**Important:** Never commit this file to Git (it's already in .gitignore)

### 4. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:4000` (or the PORT you specified in `.env`).

### 5. Build and Run (Production)

```bash
npm run build
npm run start
```

## Project Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middlewares/      # Express middlewares
├── models/          # Database models and routes
├── routes/          # API route definitions
├── db.ts            # MongoDB Mongoose connection
├── firebase.ts      # Firebase Admin setup
├── emailService.ts  # Email sending service
└── index.ts         # Main application entry
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/auth/*` - Authentication endpoints
- `GET /api/products/*` - Product endpoints
- And more... (see routes folder)

## Deployment

This project is configured for Vercel deployment. The `vercel.json` file handles serverless configuration.

## Troubleshooting

### Database Connection Issues
- Verify your `MONGODB_URI` is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure network connectivity

### Firebase Authentication Issues
- Verify `firebase-service-account.json` is in the correct location
- Check Firebase project settings
- Ensure API key is valid

### Email Sending Issues
- Use Gmail App Password (not your regular password)
- Enable 2FA on your Gmail account to generate App Passwords
- Verify SMTP settings are correct

## Support

For issues, please check the logs or contact the development team.

---

## 🚀 For Team Members - Getting Started

If you're setting up this project on your machine for the first time:

### Option 1: Automated Setup (Recommended)

```bash
git clone <repository-url>
cd server
./setup.sh
```

Then run `npm run check` to verify your configuration.

### Option 2: Manual Setup

Follow the steps in `SETUP.md` for detailed instructions.

### Verify Your Setup

Run this command to check if everything is configured correctly:

```bash
npm run check
```

This will validate:
- Environment variables
- Firebase service account
- Dependencies
- TypeScript compilation

**Note:** You need to provide your own:
1. MongoDB connection string
2. Firebase service account JSON file
3. Gmail app password for SMTP
4. JWT and admin secrets

See `.env.example` for required variables.
