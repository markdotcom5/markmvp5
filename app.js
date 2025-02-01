// ============================
// 1. ENV & REQUIRED MODULES
// ============================
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const http = require("http");
const compression = require("compression");
const MongoStore = require("connect-mongo");
const { authenticate } = require("./middleware/authenticate");

// ✅ Initialize Express App First
const app = express();

// ✅ Create HTTP Server Before WebSocket Setup
const server = http.createServer(app);

// ✅ Now that `server` exists, initialize WebSocket
const { setupWebSocketServer } = require("./middleware/authenticate");
const { wss, broadcastMessage } = setupWebSocketServer(server);

// ✅ Import Custom Modules & Routers
const stripeRouter = require("./routes/stripe");
const stripeWebhook = require("./webhooks/stripe");
const subscriptionRouter = require("./routes/subscription");
const aiRoutes = require("./routes/aiRoutes").router;
const leaderboardRoutes = require("./routes/leaderboard");
const trainingRoutes = require("./routes/training");
const dashboardRouter = require("./routes/dashboard");

// ✅ Middleware
app.use(compression());
app.use(express.json({ strict: false }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

console.log("✅ WebSocket Server Initialized");

// ✅ Serve Static Files
app.use(express.static(path.join(__dirname, "public")));

// ✅ Define Routes
app.use("/api/stripe", stripeRouter);
app.use("/webhook/stripe", stripeWebhook);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/ai", aiRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/dashboard", dashboardRouter);

const router = express.Router();

router.get("/", authenticate, (req, res) => {
  res.render("dashboard");
});
// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// ============================
// 2. DATABASE & SERVER SETUP
// ============================
mongoose.set("strictQuery", true);
if (process.env.NODE_ENV === "development") {
  mongoose.set("debug", true);
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_TIMEOUT, 10) || 5000,
      autoIndex: process.env.MONGO_AUTO_INDEX === "true",
      maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE, 10) || 10,
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT, 10) || 45000,
      retryWrites: true,
    });
    console.log("✅ MongoDB Connection Established");

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB Disconnected. Attempting to reconnect...");
      setTimeout(connectDB, 5000);
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB Reconnected Successfully");
    });
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

const reconnectMongoDB = async () => {
  console.log("🔄 Attempting to reconnect to MongoDB...");
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Reconnected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Reconnection Failed:", error);
    setTimeout(reconnectMongoDB, 5000);
  }
};

// ============================
// 3. MIDDLEWARE SETUP
// ============================
app.use(compression());
app.use(express.json({ strict: false }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

app.use(
  session({
    secret: process.env.JWT_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 14 * 24 * 60 * 60, // 14 days
      autoRemove: "native",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ============================
// 4. ROUTES SETUP
// ============================

// Home route: Render index.ejs
app.get("/", (req, res) => {
  res.render("index");
});

// Mount API routers
app.use("/api/dashboard", dashboardRouter);
app.use("/api/ai", aiRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/stripe", stripeRouter);
app.use("/api/subscription", subscriptionRouter);

// Mount Dashboard router for view rendering (if needed separately)
app.use("/dashboard", dashboardRouter);

// Test Routes
const testRoutes = express.Router();

testRoutes.post("/progress", (req, res) => {
  try {
    const { progress } = req.body;
    if (!progress) {
      return res.status(400).json({ error: "Missing 'progress' field in request body" });
    }
    if (wss && wss.clients) {
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({ type: "progress_update", progress }));
        }
      });
    } else {
      console.warn("⚠️ WebSocket Server (`wss`) is not initialized.");
    }
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error in /progress:", error);
    res.status(500).json({ error: error.message });
  }
});

testRoutes.post("/achievement", (req, res) => {
  try {
    const { achievement } = req.body;
    if (!achievement) {
      return res.status(400).json({ error: "Missing 'achievement' field in request body" });
    }
    if (wss && wss.clients) {
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({ type: "achievement_unlocked", achievement }));
        }
      });
    } else {
      console.warn("⚠️ WebSocket Server (`wss`) is not initialized.");
    }
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error in /achievement:", error);
    res.status(500).json({ error: error.message });
  }
});

app.use("/api/test", testRoutes);

// Register additional routers using safeRequire
const routers = {
  about: safeRequire("./routes/about"),
  achievements: safeRequire("./routes/achievements"),
  ai: aiRoutes, // AI routes
  aiWebController: safeRequire("./routes/aiWebController"),
  auth: safeRequire("./routes/auth"),
  community: safeRequire("./routes/communityRoutes"),
  dashboard: safeRequire("./routes/dashboard"),
  index: safeRequire("./routes/index"),
  insights: safeRequire("./routes/insights"),
  main: safeRequire("./routes/main"),
  modules: safeRequire("./routes/modules"),
  payment: safeRequire("./routes/payment"),
  signup: safeRequire("./routes/signup"),
  stripe: stripeRouter,
  subscription: subscriptionRouter,
  testOpenAI: safeRequire("./routes/testOpenAI"),
  training: safeRequire("./routes/training"),
  user: safeRequire("./routes/user"),
  video: safeRequire("./routes/video"),
};

// Safe module loader to prevent crashing if a module is missing
function safeRequire(modulePath) {
  try {
    return require(modulePath);
  } catch (error) {
    console.error(`❌ Failed to load module: ${modulePath}`, error.message);
    return null;
  }
}

// Register the routers
Object.entries(routers).forEach(([name, router]) => {
  console.log(`Registering route: /api/${name}, Type: ${typeof router}`);
  if (typeof router === "function") {
    app.use(`/api/${name}`, router);
    console.log(`✅ Registered route: /api/${name}`);
  } else {
    console.error(
      `❌ Error: Router for /api/${name} is invalid. Expected a function, got ${typeof router}`
    );
  }
});

// Stripe webhook (must come before body parsers that affect raw payloads)
app.use(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// ============================
// 5. ERROR HANDLING
// ============================
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource could not be found.",
    path: req.path,
  });
});

app.use((err, req, res, next) => {
  if (err.code === "ENOENT") {
    console.warn(`File not found: ${req.path}`);
    return res.status(404).send("File not found");
  }
  if (err.message && err.message.includes("Range Not Satisfiable")) {
    console.warn(`Range error for file: ${req.path}`);
    return res.status(416).send("Range Not Satisfiable");
  }
  console.error("Global Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res.status(err.status || 500).json({
    error: "Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "An unexpected error occurred",
  });
});

// ============================
// 6. RATE LIMITING
// ============================
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "AI service rate limit exceeded. Please try again later." },
});

const fsdLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "FSD service rate limit exceeded. Please try again later." },
});

// Apply rate limiting before defining routes
app.use("/api/ai", aiLimiter);
app.use("/api/ai/fsd", fsdLimiter);

// ============================
// 7. SERVER STARTUP
// ============================
const startServer = async () => {
  await connectDB(); // ✅ Ensures database connects before starting server

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  console.log("✅ WebSocket Server Initialized");
};

startServer();

module.exports = app;