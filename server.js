// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"], // Allow Vite dev server
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// OpenRouter configuration with backup models
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const MODELS = [
  "microsoft/phi-3-mini-128k-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free", 
  "qwen/qwen-2-7b-instruct:free",
  "google/gemma-2-9b-it:free"
];
let currentModelIndex = 0;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP

if (!OPENROUTER_API_KEY) {
  console.error("⚠️ OPENROUTER_API_KEY not found in environment variables");
  process.exit(1);
} 

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    status: "✅ Server is running!", 
    timestamp: new Date().toISOString(),
    endpoints: ["/chat", "/health"]
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

  // Rate limiting check
  const now = Date.now();
  const userRequests = rateLimitMap.get(clientIP) || [];
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ 
      error: "Rate limit exceeded. Please wait a minute before sending another message." 
    });
  }
  
  // Add current request to rate limit tracker
  recentRequests.push(now);
  rateLimitMap.set(clientIP, recentRequests);

  // Validate input
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ 
      error: "Message is required and must be a non-empty string" 
    });
  }

  // Message length check
  if (message.length > 5000) {
    return res.status(400).json({ 
      error: "Message too long. Please keep it under 5,000 characters." 
    });
  }

  let lastError = null;
  
  // Try each model until one works
  for (let attempt = 0; attempt < MODELS.length; attempt++) {
    const modelName = MODELS[(currentModelIndex + attempt) % MODELS.length];
    
    try {
      console.log(`📨 Trying model ${modelName} for message: ${message.substring(0, 50)}...`);
      
      // OpenRouter API call with current model
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "Bangalore Chatbot",
        },
        body: JSON.stringify({
          "model": modelName,
          "messages": [
            {
              "role": "system",
              "content": "You are a helpful assistant specializing in Bangalore city information. Provide relevant and helpful information about Bangalore including tourist spots, local cuisine, tech parks, transportation, neighborhoods, education, events, and festivals. Keep responses concise and informative."
            },
            {
              "role": "user",
              "content": message
            }
          ],
          "temperature": 0.7,
          "max_tokens": 1500, // Reduced to avoid rate limits
          "top_p": 0.9,
          "frequency_penalty": 0,
          "presence_penalty": 0
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
          const aiResponse = data.choices[0].message.content;
          
          if (aiResponse && aiResponse.trim().length > 0) {
            console.log(`✅ Success with model: ${modelName}`);
            // Update current model to the working one
            currentModelIndex = (currentModelIndex + attempt) % MODELS.length;
            return res.json({ reply: aiResponse });
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        lastError = new Error(`Model ${modelName} failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
        console.log(`⚠️ Model ${modelName} failed, trying next...`);
        
        // If this model is rate limited, skip to next immediately
        if (response.status === 429) {
          continue;
        }
      }
    } catch (error) {
      lastError = error;
      console.log(`⚠️ Model ${modelName} error: ${error.message}, trying next...`);
      continue;
    }
  }
  
  // All models failed
  console.error("❌ All models failed:", lastError);
  
  if (lastError && lastError.message.includes("429")) {
    return res.status(429).json({ 
      error: "All AI models are currently busy. Please try again in a few minutes." 
    });
  }
  
  res.status(500).json({ 
    error: "Sorry, I'm experiencing technical difficulties. Please try again in a moment.",
    details: process.env.NODE_ENV === 'development' ? lastError?.message : undefined
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint not found",
    availableEndpoints: ["/", "/health", "/chat"]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/chat`);
  console.log(`📡 CORS enabled for: http://localhost:5173`);
  console.log(`🤖 Using OpenRouter with backup models:`);
  MODELS.forEach((model, index) => {
    console.log(`   ${index + 1}. ${model}`);
  });
  console.log(`⏱️ Rate limit: ${MAX_REQUESTS_PER_WINDOW} requests per minute per IP`);
});
