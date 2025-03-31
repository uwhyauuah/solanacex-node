const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const monitoringService = require('./services/monitoringService');
const authRoutes = require('./routes/authRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const profileRoutes = require('./routes/profileRoutes');
const tradeRoutes = require('./routes/tradeRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/balances', balanceRoutes);
app.use('/api', profileRoutes);
app.use('/trade', tradeRoutes);


app.get('/', (req, res) => {
    res.send('Hello World');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Send initial price data if available
    setInterval(() => {
        if (monitoringService.solKlinesPrice) {
            socket.emit('sol', monitoringService.solKlinesPrice);
        }
    }, 1000);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start monitoring services
monitoringService.startBalanceMonitoring();
monitoringService.startPriceMonitoring(io);

// Handle process termination
process.on('SIGINT', () => {
    monitoringService.stopBalanceMonitoring();
    server.close(() => {
        console.log('Server closed');
        process.exit();
    });
});

// Start the server
server.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
}); 