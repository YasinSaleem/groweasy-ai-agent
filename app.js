require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const chatRoutes = require("./routes/chatRoutes");
const cors = require("cors"); // Add this line

const app = express();

// Add CORS middleware before other middleware
app.use(cors({

  origin: process.env.NODE_ENV === 'production' 
    ? 'https://groweasy-ai-agent.vercel.app' 
    : ['http://localhost:3000', 'http://localhost:3001'],

  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());

app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("GrowEasy AI Agent is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});