import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';


dotenv.config();

const app = express();
app.use(cors({ origin: "*" })); 
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  },
  transports: ['websocket'] 
});


const validateSecret = (req: Request, res: Response, next: NextFunction) => {
  const secret = req.headers['x-socket-secret'];
  const internalSecret = process.env.SOCKET_INTERNAL_SECRET || 'your_default_secure_secret_here';
  
  if (secret !== internalSecret) {
    console.warn(`[UNAUTHORIZED ACCESS] Attempted internal notification from ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};


app.post('/notify-update', validateSecret, (req: Request, res: Response) => {
  const { sportName, type = 'availability_changed', data = {} } = req.body;
  
  if (!sportName) {
    return res.status(400).send('sportName is required');
  }

  
  io.to(`sport:${sportName}`).emit(type, { sportName, ...data });
  
  console.log(`[EVENT] Broadcasted '${type}' for '${sportName}' via Internal API`);
  res.status(200).send('OK');
});

app.post('/notify-matches', validateSecret, (req: Request, res: Response) => {
  io.emit('matches_updated');
  console.log('[EVENT] Broadcasted \'matches_updated\' via Internal API');
  res.status(200).send('OK');
});


io.on('connection', (socket) => {
  console.log(`[CONNECTION] Client connected: ${socket.id} (Transport: ${socket.conn.transport.name})`);

  socket.on('join_sport', (sportName: string) => {
    socket.join(`sport:${sportName}`);
    console.log(`[ROOM] Socket ${socket.id} joined 'sport:${sportName}'`);
  });

  socket.on('availability_update', (data) => {
    const { sportName } = data;
    io.to(`sport:${sportName}`).emit('availability_changed', data);
    console.log(`[EVENT] Client update for ${sportName}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[DISCONNECT] Client ${socket.id} disconnected (${reason})`);
  });
});

const PORT = process.env.PORT || 3005;
httpServer.listen(PORT, () => {
  console.log(`
  🚀 STANDALONE SOCKET.IO SERVER READY
  ------------------------------------
  Port:      ${PORT}
  Transport: WebSocket (exclusive)
  Health:    http://localhost:${PORT}/
  ------------------------------------
  `);
});

app.get('/', (req, res) => res.send('Socket Server Online'));
