import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});


app.post('/notify-update', (req: Request, res: Response) => {
  const { sportName, type = 'availability_changed', data = {} } = req.body;
  if (!sportName) {
    return res.status(400).send('sportName is required');
  }

  
  io.to(`sport:${sportName}`).emit(type, { sportName, ...data });
  console.log(`Internal notification: Update for ${sportName} (Type: ${type})`);
  res.status(200).send('OK');
});

app.post('/notify-matches', (req: Request, res: Response) => {
  
  io.emit('matches_updated');
  console.log('Internal notification: Matches updated');
  res.status(200).send('OK');
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_sport', (sportName: string) => {
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
