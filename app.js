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
const { setupWebSocketServer } = require("./middleware/authenticate");
const AIWebController = require("./services/AIWebController");
const compression = require('compression');
const stripeRouter = require("./routes/stripe");
const stripeWebhook = require("./webhooks/stripe");
const subscriptionRouter = require("./routes/subscription");
const aiRouter = require("./routes/aiRoutes").router;
const testRouter = require('./routes/testRoutes');
const leaderboardRoutes = require('./routes/leaderboard');

const app = express();

function cleanup(signal) {
    console.log(`🧹 Received ${signal}. Cleaning up before exit...`);
    if (server) {
        server.close(() => {
            console.log("🛑 Server closed.");
        });
    }
    if (mongoose.connection.readyState === 1) {
        mongoose.connection.close(false, () => {
            console.log("🔌 MongoDB connection closed.");
            process.exit(0);
        });
    } else {
        console.log("🔌 MongoDB was not connected.");
        process.exit(0);
    }
}

process.on("SIGINT", () => cleanup("SIGINT"));
process.on("SIGTERM", () => cleanup("SIGTERM"));

app.use(compression());
app.use('/api/leaderboard', leaderboardRoutes); // Register leaderboard routes

app.use(express.static(path.join(__dirname, "public"), {
    maxAge: '7d'
}));

if (process.env.NODE_ENV === "development") {
    app.get("/test-css", (req, res) => {
        const cssPath = path.join(__dirname, "public", "css", "main.css");
        fs.access(cssPath, fs.constants.F_OK, (err) => {
            if (err) {
                res.status(404).json({ error: "CSS file not found", path: cssPath });
            } else {
                res.status(200).json({ success: "CSS file exists", path: cssPath });
            }
        });
    });
    app.get('/test-image', (req, res) => {
        const imagePath = path.join(__dirname, 'public', 'css', 'images', 'space_orbital.png');
        res.sendFile(imagePath, (err) => {
            if (err) {
                console.error('Error serving image:', err);
                res.status(404).send('Image not found');
            }
        });
    });
    
    app.get("/test-video", (req, res) => {
        const videoPath = path.join(__dirname, "public", "videos", "stelacktop.mp4");
        fs.access(videoPath, fs.constants.F_OK, (err) => {
            if (err) {
                res.status(404).json({ error: "Video file not found", path: videoPath });
            } else {
                res.status(200).json({ success: "Video file exists", path: videoPath });
            }
        });
    });
}

app.get("/video-test", (req, res) => {
    const videoPath = path.join(__dirname, "public", "videos", "stelacktop.mov");
    fs.access(videoPath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error("Video file not found:", videoPath);
            res.status(404).send("Video file not found");
        } else {
            res.sendFile(videoPath, (err) => {
                if (err) {
                    console.error("Error serving video:", err);
                    res.status(500).send("Failed to load video");
                }
            });
        }
    });
});

mongoose.set("strictQuery", true);

if (process.env.NODE_ENV === "development") {
    mongoose.set("debug", true);
}

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: parseInt(process.env.MONGO_TIMEOUT, 10) || 5000,
            autoIndex: process.env.MONGO_AUTO_INDEX === "true",
            maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE, 10) || 10,
            socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT, 10) || 45000,
        });

        console.log("✅ MongoDB Connection Established");

        mongoose.connection.on("error", (err) => {
            console.error("MongoDB Error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.log("MongoDB Disconnected. Attempting to reconnect...");
        });

        mongoose.connection.on("reconnected", () => {
            console.log("MongoDB Reconnected Successfully");
        });

        return conn;
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        process.exit(1);
    }
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

const MongoStore = require("connect-mongo");
app.use(
    session({
        secret: process.env.JWT_SECRET || "your_secret_key",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            ttl: 14 * 24 * 60 * 60,
            autoRemove: "native",
        }),
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 14 * 24 * 60 * 60 * 1000,
        },
    })
);

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https:", "https://cdnjs.cloudflare.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "https:"],
                imgSrc: ["'self'", "data:", "https:", "/api/placeholder"],
                frameSrc: ["'self'", "https://www.sora.com"],
                connectSrc: ["'self'", "https://api.openai.com"],
                fontSrc: ["'self'", "https:", "data:"],
                mediaSrc: ["'self'", "blob:", "data:"],
            },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

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

app.use("/api/ai", aiLimiter);
app.use("/api/ai/fsd", fsdLimiter);

app.use('/webhook/stripe', express.raw({type: 'application/json'}), stripeWebhook);

// Later in routers section
const routers = {
    about: require("./routes/about"),
    achievements: require("./routes/achievements"),
    ai: aiRouter,
    aiWebController: require("./routes/aiWebController"),
    auth: require("./routes/auth"),
    community: require("./routes/communityRoutes"),
    dashboard: require("./routes/dashboard"),
    index: require("./routes/index"),
    insights: require("./routes/insights"),
    leaderboard: require("./routes/leaderboard"),
    main: require("./routes/main"),
    modules: require("./routes/modules"),
    payment: require("./routes/payment"),
    signup: require("./routes/signup"),
    stripe: stripeRouter,
    subscription: require("./routes/subscription"),
    testOpenAI: require("./routes/testOpenAI"),
    training: require("./routes/training"),
    user: require("./routes/user"),
    video: require("./routes/video")
 };

Object.entries(routers).forEach(([name, router]) => {
    console.log(`Registering route: /api/${name}, Type: ${typeof router}`);
    if (typeof router === "function") {
        app.use(`/api/${name}`, router);
        console.log(`Registered route: /api/${name}`);
    } else {
        console.error(`Error: Router for /api/${name} is invalid. Expected a function, got ${typeof router}`);
    }
});

app.use('/api/testRoutes', testRouter);

// WebSocket Integration
const server = http.createServer(app);
const { wss, broadcastMessage } = setupWebSocketServer(server);

// Error Handling
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

const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 3000;
        
        server.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });

        server.on("error", (err) => {
            if (err.code === "EADDRINUSE") {
                console.error(`❌ Port ${PORT} is already in use. Trying a different port...`);
                const fallbackPort = PORT + 1;
                server.listen(fallbackPort, () => {
                    console.log(`✅ Server running on http://localhost:${fallbackPort}`);
                });
            } else {
                console.error("Unhandled server error:", err);
            }
        });

        process.on("SIGINT", () => cleanup("SIGINT"));
        process.on("SIGTERM", () => cleanup("SIGTERM"));

    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();

module.exports = app;