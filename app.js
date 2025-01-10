require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const http = require('http');
const { setupWebSocketServer, authenticate } = require('./middleware/authenticate');
const AIWebController = require('./services/AIWebController');

const app = express();

// =======================
// Enhanced Static File Serving
// =======================

// Serve specific directories with explicit paths
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/video', express.static(path.join(__dirname, 'public', 'video'))); // Changed from videos to video
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Serve other static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Add debug logging for development
if (process.env.NODE_ENV === 'development') {
    console.log('Static directory paths:');
    console.log('CSS:', path.join(__dirname, 'public', 'css'));
    console.log('JS:', path.join(__dirname, 'public', 'js'));
    console.log('Video:', path.join(__dirname, 'public', 'video'));
    console.log('Images:', path.join(__dirname, 'public', 'images'));
}
// Add test route to validate CSS file existence
app.get('/test-css', (req, res) => {
    const cssPath = path.join(__dirname, 'public', 'css', 'main.css');
    fs.access(cssPath, fs.constants.F_OK, (err) => {
        if (err) {
            res.json({ error: 'CSS file not found', path: cssPath });
        } else {
            res.json({ success: 'CSS file exists', path: cssPath });
        }
    });
});

// =======================
// MongoDB Configuration
// =======================
mongoose.set('strictQuery', true);

if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', true);
}

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: parseInt(process.env.MONGO_TIMEOUT, 10) || 5000,
            autoIndex: process.env.MONGO_AUTO_INDEX === 'true',
            maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE, 10) || 10,
            socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT, 10) || 45000,
        });

        console.log('✅ MongoDB Connection Established');

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB Error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB Disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB Reconnected Successfully');
        });

        return conn;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

// =======================
// Middleware Setup
// =======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

// Session Configuration
const MongoStore = require('connect-mongo');
app.use(session({
    secret: process.env.JWT_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60,
        autoRemove: 'native',
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 14 * 24 * 60 * 60 * 1000,
    },
}));

// Security Configuration
app.use(helmet({
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
}));

// Rate Limiting
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'AI service rate limit exceeded. Please try again later.' },
});

const fsdLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'FSD service rate limit exceeded. Please try again later.' },
});

app.use('/api/ai', aiLimiter);
app.use('/api/ai/fsd', fsdLimiter);

// =======================
// Register Routes
// =======================
const routers = {
    aboutRouter: require('./routes/about'),
    achievementsRouter: require('./routes/achievements'),
    aiRouter: require('./routes/aiRoutes'),
    authRouter: require('./routes/auth'),
    dashboardRouter: require('./routes/dashboard'),
    indexRouter: require('./routes/index'),
    leaderboardRouter: require('./routes/leaderboard'),
    mainRouter: require('./routes/main'),
    modulesRouter: require('./routes/modules'),
    paymentRouter: require('./routes/payment'),
    signupRouter: require('./routes/signup'),
    testRouter: require('./routes/testRoutes'),
    trainingRouter: require('./routes/training'),
    userRouter: require('./routes/user'),
    videoRouter: require('./routes/video'),
    webhooksRouter: require('./routes/webhooks'),
    testOpenAIRouter: require('./routes/testOpenAI'),
    aiWebControllerRouter: require('./routes/aiWebController'),
};

// Dynamic Route Registration
for (const [name, router] of Object.entries(routers)) {
    const routePath = `/api/${name.replace('Router', '').toLowerCase()}`;
    app.use(routePath, router);
    console.log(`Registered route: ${routePath}`);
}

// =======================
// WebSocket Integration
// =======================
const server = http.createServer(app);
const { wss, broadcastMessage } = setupWebSocketServer(server);

// =======================
// Error Handling
// =======================
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource could not be found.',
        path: req.path,
    });
});

app.use((err, req, res, next) => {
    if (err.code === 'ENOENT') {
        console.warn(`File not found: ${req.path}`);
        res.status(404).send('File not found');
        return;
    }
    if (err.message.includes('Range Not Satisfiable')) {
        console.warn(`Range error for file: ${req.path}`);
        res.status(416).send('Range Not Satisfiable');
        return;
    }
    console.error('Global Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    res.status(err.status || 500).json({
        error: 'Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    });
});

// =======================
// Start the Server
// =======================
const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
