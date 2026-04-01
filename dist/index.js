"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
app.post('/notify-update', (req, res) => {
    const { sportName, type = 'availability_changed', data = {} } = req.body;
    if (!sportName) {
        return res.status(400).send('sportName is required');
    }
    io.to(`sport:${sportName}`).emit(type, { sportName, ...data });
    console.log(`Internal notification: Update for ${sportName} (Type: ${type})`);
    res.status(200).send('OK');
});
app.post('/notify-matches', (req, res) => {
    io.emit('matches_updated');
    console.log('Internal notification: Matches updated');
    res.status(200).send('OK');
});
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('join_sport', (sportName) => {
        socket.join(`sport:${sportName}`);
        console.log(`Socket ${socket.id} joined room: sport:${sportName}`);
    });
    socket.on('availability_update', (data) => {
        const { sportName } = data;
        io.to(`sport:${sportName}`).emit('availability_changed', data);
        console.log(`Broadcasted update for ${sportName}`);
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
const PORT = process.env.PORT || 3005;
httpServer.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`);
});
