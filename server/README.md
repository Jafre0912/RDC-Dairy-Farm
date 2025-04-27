# Dairy Management System - Server

This is the backend server for the Dairy Management System.

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the configuration values as needed

3. **Gemini API Key Setup (Important)**:
   - The disease prediction feature uses Google's Gemini API
   - Get your API key from https://makersuite.google.com/app/apikey
   - Add your API key to the `.env` file:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```
   - If you don't add a valid API key, the system will use mock data instead

4. Start the server:
   ```
   npm run dev
   ```

## API Routes

- **Auth**: `/api/auth`
- **Cattle**: `/api/cattle`
- **Milk Production**: `/api/milk-production`
- **Finance**: `/api/finance`
- **Disease**: `/api/disease`

## Gemini AI API

The disease prediction feature uses Google's Gemini AI to analyze symptoms and predict potential cattle diseases. For this to work properly, you need to:

1. Create a Google Cloud account if you don't have one
2. Visit https://makersuite.google.com/app/apikey
3. Create a new API key 
4. Copy the key to your `.env` file

If you prefer not to use the actual AI service, you can leave the API key empty and the system will use pre-defined mock responses. 