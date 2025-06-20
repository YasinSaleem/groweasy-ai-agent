# GrowEasy AI Real Estate Agent

An AI-powered real estate assistant that qualifies leads through natural conversation.

<h2>Landing Page</h2>
<img width="1511" alt="Screenshot 2025-06-18 at 4 07 03 PM" src="https://github.com/user-attachments/assets/c66f1392-16c9-44ef-be35-56a8aa9f8154" />


<h2>Chat Page</h2>
<img width="1512" alt="Screenshot 2025-06-20 at 6 04 42 PM" src="https://github.com/user-attachments/assets/57f899d3-59f5-44e2-8f2c-8eac64c6b36f" />


<h2>Main Chat Page</h2>

<img width="1512" alt="Screenshot 2025-06-18 at 4 08 16 PM" src="https://github.com/user-attachments/assets/ab97db0b-a318-43ae-ae49-0270860f2a7c" />

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

## Configuration File Format

The assistant uses a configuration file to understand how to qualify leads and drive conversation.

### `realEstateConfig.json`

```json
{
  "industry": "real estate",
  "location": "Pune",
  "qualifyingCriteria": [
    "property type",
    "budget range",
    "location preference",
    "timeline",
    "purpose"
  ],
  "greeting": "Hi {name}! Thanks for reaching out. I'm your GrowEasy real estate assistant.",
  "questions": [
    "Could you share which city/location you're looking for?",
    "Are you looking for a flat, villa, or plot?",
    "Is this for investment or personal use?",
    "What's your budget range? (e.g., 50L–80L)",
    "What's your preferred timeline for this purchase?"
  ],
  "classificationRules": {
    "hot": [
      "clear budget specified",
      "specific location mentioned",
      "timeline under 6 months"
    ],
    "cold": [
      "vague requirements",
      "no urgency indicated",
      "just browsing"
    ],
    "invalid": [
      "gibberish responses",
      "test entries",
      "no meaningful engagement"
    ]
  }
}
```



