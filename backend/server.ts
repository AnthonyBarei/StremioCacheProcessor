import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import Database from './db';
import CONFIG from './config';
import Processor from './processor/processor';


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
db.connect();

app.get('/', (req, res) => {
  res.send('Hello World!');
});


const start = async () => { 
  const dbConfig = await db.get('config', true);
  const config = dbConfig || CONFIG;
  const processor = new Processor(db, io, app, config);
  processor.run();
};

start();

// ------------------------------------------------------------------------------------

