import express, { NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const allowedOrigins = (process.env.SOCKET_ALLOWED_ORIGINS || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigin = allowedOrigins.includes('*') ? '*' : allowedOrigins;

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'],
});

const validateSecret = (req: Request, res: Response, next: NextFunction) => {
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

app.post('/notify-update', validateSecret, (req: Request, res: Response) => {
  const { sportName, type = 'availability_changed', data = {} } = req.body;

  if (typeof sportName !== 'string' || !sportName.trim()) {
    return res.status(400).send('sportName is required');
  }

  io.to(`sport:${sportName}`).emit(type, { sportName, ...data });
  res.status(200).send('OK');
});

app.post('/notify-matches', validateSecret, (_req: Request, res: Response) => {
  io.emit('matches_updated');
  res.status(200).send('OK');
});

io.on('connection', (socket) => {
  socket.on('join_sport', (sportName: string) => {
    if (typeof sportName !== 'string' || !sportName.trim()) return;
    socket.join(`sport:${sportName}`);
  });

  socket.on('availability_update', (data) => {
    const { sportName } = data;
    if (typeof sportName !== 'string' || !sportName.trim()) return;
    io.to(`sport:${sportName}`).emit('availability_changed', data);
  });
});

const PORT = process.env.PORT || 3005;
httpServer.listen(PORT);

app.get('/', (_req, res) => res.send('Socket Server Online'));
