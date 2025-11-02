const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  }
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.APP_VERSION || '1.0.0',
    database: 'connected'
  });
});

// API Info endpoint
app.use('/api-info', require('./routes/api-info'));

// API Routes
app.use('/auth', require('./routes/auth'));
app.use('/tournaments', require('./routes/tournaments'));
app.use('/streams', require('./routes/streams'));
app.use('/leaderboard', require('./routes/leaderboard'));
app.use('/wallet', require('./routes/wallet'));
app.use('/rewards', require('./routes/rewards'));
app.use('/teams', require('./routes/teams'));
app.use('/support', require('./routes/support'));
app.use('/users/me', require('./routes/profile'));
app.use('/users/me/notifications', require('./routes/notifications'));
app.use('/users/me/tournaments', require('./routes/userTournaments'));
app.use('/users/me/wallet', require('./routes/userWallet'));
app.use('/users/me/rewards', require('./routes/userRewards'));
app.use('/home', require('./routes/home'));

// Admin routes
app.use('/admin/auth', require('./routes/admin/auth'));
app.use('/admin/tournaments', require('./routes/admin/tournaments'));
app.use('/admin/users', require('./routes/admin/users'));
app.use('/admin/kyc', require('./routes/admin/kyc'));
app.use('/admin/teams', require('./routes/admin/teams'));
app.use('/admin/support', require('./routes/admin/support'));
app.use('/admin/transactions', require('./routes/admin/transactions'));
app.use('/admin/rewards', require('./routes/admin/rewards'));
app.use('/admin/streams', require('./routes/admin/streams'));
app.use('/admin/analytics', require('./routes/admin/analytics'));
app.use('/admin/notifications', require('./routes/admin/notifications'));
app.use('/admin/wallet/packages', require('./routes/admin/packages'));
app.use('/admin/admins', require('./routes/admin/admins'));
app.use('/admin/settings', require('./routes/admin/settings'));
app.use('/admin/leaderboard', require('./routes/admin/leaderboard'));
app.use('/admin/audit-logs', require('./routes/admin/audit'));

// WebSocket setup (if needed)
// const http = require('http');
// const { Server } = require('socket.io');
// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: '*' } });
// require('./websockets')(io);

// Error handler (must be last)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

const PORT = process.env.PORT || 3000;

// WebSocket setup
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST']
  }
});

const { setupWebSockets } = require('./websockets');
setupWebSockets(io);

// Make io available to routes (for broadcasting)
app.set('io', io);

server.listen(PORT, () => {
  console.log('========================================');
  console.log('  Gaming Tournament Platform API');
  console.log('========================================');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📚 Health: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 WebSockets: Enabled`);
  console.log('========================================\n');
});

module.exports = { app, server, io };

