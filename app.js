require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { authenticate } = require('./middleware/authenticate');
const AIWebController = require('./services/AIWebController');

const app = express();

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
            serverSelectionTimeoutMS: process.env.MONGO_TIMEOUT || 5000,
            autoIndex: process.env.MONGO_AUTO_INDEX === 'true',
            maxPoolSize: process.env.MONGO_POOL_SIZE || 10,
            socketTimeoutMS: process.env.MONGO_SOCKET_TIMEOUT || 45000,
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

module.exports = connectDB;

// =======================
// Middleware Setup
// =======================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https:", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            imgSrc: ["'self'", "data:", "https:"],
            frameSrc: ["'self'", "https://www.sora.com"],
            connectSrc: ["'self'", "https://api.openai.com"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

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
// Import and Register Routes
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

// Debug logs to validate routes and middleware
for (const [name, router] of Object.entries(routers)) {
    
}

// Register Routes
app.use('/api/about', routers.aboutRouter);
app.use('/api/achievements', authenticate, routers.achievementsRouter);
app.use('/api/ai', routers.aiRouter);
app.use('/api/auth', routers.authRouter);
app.use('/api/dashboard', authenticate, routers.dashboardRouter);
app.use('/api/leaderboard', authenticate, routers.leaderboardRouter);
app.use('/api/main', authenticate, routers.mainRouter);
app.use('/api/modules', authenticate, routers.modulesRouter);
app.use('/api/payment', authenticate, routers.paymentRouter);
app.use('/api/signup', routers.signupRouter);
app.use('/api/test', routers.testRouter);
app.use('/api/training', authenticate, routers.trainingRouter);
app.use('/api/user', authenticate, routers.userRouter);
app.use('/api/video', authenticate, routers.videoRouter);
app.use('/api/webhooks', routers.webhooksRouter);
app.use('/api/openai', routers.testOpenAIRouter);
app.use('/api/ai-web', routers.aiWebControllerRouter);
app.use('/', routers.indexRouter);

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
    console.error('Global Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.message,
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Authentication Error',
            message: 'Invalid or expired token',
        });
    }

    res.status(err.status || 500).json({
        error: 'Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    });
});

// =======================
// Initialize Server
// =======================
const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
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
