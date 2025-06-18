# GrowEasy AI Real Estate Agent

An AI-powered real estate assistant that qualifies leads through natural conversation.

## Features

- Natural language property inquiries  
- Lead qualification (Hot/Cold/Invalid)  
- Progressive data collection  
- Gibberish/spam detection  
- Supabase database integration  

## Prerequisites

- Node.js (v16+)  
- npm (v8+)  
- Supabase account  
- Google Gemini API key  

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/groweasy-ai-agent.git
cd groweasy-ai-agent
```

### 2. Install dependencies

Run these commands in both root and client directories:

```bash
# In root directory
npm install

# In client directory
cd client && npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory with the following content:

```env
SUPABASE_URL=your_supabase_url  
SUPABASE_KEY=your_supabase_key  
GEMINI_API_KEY=your_gemini_api_key  
PORT=3001  
```

### 4. Running the Application

Open two terminal sessions:

**Terminal 1 (Server - root directory):**

```bash
npm run dev
```

**Terminal 2 (Client - client directory):**

```bash
cd client
npm start
```

## Sample Conversations

### Normal Flow

**User:** "I want a villa in Mumbai with 2Cr budget"

```json
{
  "response": "Great! When do you plan to purchase?",
  "metadata": {
    "location": "Mumbai",
    "propertyType": "villa",
    "budget": "2Cr"
  }
}
```

### Gibberish Handling

**User:** "asdfgh123"

```json
{
  "response": "Could you clarify your requirements?",
  "classification": "cold"
}
```

**User:** "987654321"

```json
{
  "response": "This appears to be a test entry. Please contact us later.",
  "classification": "invalid"
}
```

## Database Requirements

### `leads` table

| Column          | Type    | Description     |
|-----------------|---------|-----------------|
| id              | UUID    | Primary key     |
| phone           | TEXT    | Unique contact  |
| status          | TEXT    | Lead status     |
| gibberish_count | INTEGER | Spam counter    |

### `conversations` table

| Column   | Type | Description        |
|----------|------|--------------------|
| lead_id  | UUID | Foreign key        |
| content  | TEXT | Message text       |
| role     | TEXT | user / agent       |

## API Endpoints

| Endpoint              | Method | Description       |
|-----------------------|--------|-------------------|
| `/api/chat/start`     | POST   | Begin new chat    |
| `/api/chat/continue`  | POST   | Continue chat     |

## Technologies Used

- **Node.js/Express** (Backend)  
- **React** (Frontend)  
- **Google Gemini** (AI)  
- **Supabase** (Database)
