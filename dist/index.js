"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const allowedOrigins = (process.env.SOCKET_ALLOWED_ORIGINS || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const corsOrigin = allowedOrigins.includes('*') ? '*' : allowedOrigins;
app.use((0, cors_1.default)({ origin: corsOrigin }));
app.use(express_1.default.json());
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST'],
    },
    transports: ['websocket'],
});
const validateSecret = (req, res, next) => {
    const secret = req.headers['x-socket-secret'];
    const internalSecret = process.env.SOCKET_INTERNAL_SECRET;
    if (!internalSecret || internalSecret.includes('your_default') || internalSecret.includes('change-me')) {
        console.error('[CONFIG] SOCKET_INTERNAL_SECRET must be configured with a secure value.');
        return res.status(500).json({ error: 'Socket server secret is not configured' });
    }
    if (secret !== internalSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};
app.post('/notify-update', validateSecret, (req, res) => {
    const { sportName, type = 'availability_changed', data = {} } = req.body;
    if (typeof sportName !== 'string' || !sportName.trim()) {
        return res.status(400).send('sportName is required');
    }
    io.to(`sport:${sportName}`).emit(type, { sportName, ...data });
    res.status(200).send('OK');
});
app.post('/notify-matches', validateSecret, (_req, res) => {
    io.emit('matches_updated');
    res.status(200).send('OK');
});
io.on('connection', (socket) => {
    socket.on('join_sport', (sportName) => {
        if (typeof sportName !== 'string' || !sportName.trim())
            return;
        socket.join(`sport:${sportName}`);
    });
    socket.on('availability_update', (data) => {
        const { sportName } = data;
        if (typeof sportName !== 'string' || !sportName.trim())
            return;
        io.to(`sport:${sportName}`).emit('availability_changed', data);
    });
});
const PORT = process.env.PORT || 3005;
httpServer.listen(PORT);
app.get('/', (_req, res) => res.send('Socket Server Online'));
