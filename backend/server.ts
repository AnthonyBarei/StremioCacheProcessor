import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import Database from './db';
import CONFIG from './config';
import Processor from './processor/processor';
import AppStarter from './processor/appStarter';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Use express.json() middleware to parse JSON request bodies

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    // methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Connect DB
const db = new Database('redis://127.0.0.1:6379');

const appStarter = new AppStarter();

const start = async () => {
  try {
    await db.connect();
    const dbConfig = await db.get('config', true);
    const config = dbConfig || CONFIG;

    const stremioRunning = await appStarter.checkServer(config.stremio.stremioAppHost, 'Stremio');
    const qbittorrentRunning = await appStarter.checkServer(config.qbittorrent.qBittorrentAppHost, 'qBittorrent');

    if (stremioRunning && qbittorrentRunning) {
      const processor = new Processor(db, io, app, config);
      processor.run();
    } else {
      console.error('One or more servers are not running. Cannot start the processor.');
    }
  } catch (error) {
    console.error('Error starting the server:', error);
  }
};

appStarter.initializeApplications().then((initialized) => {
  if (initialized) {
    start();
  } else {
    console.error('Failed to initialize applications.');
  }
}).catch((error) => {
  console.error('Error initializing applications:', error);
});

