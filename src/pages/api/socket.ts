import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = { api: { bodyParser: false } };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(res as any).socket.server.io) {
    const io = new Server((res as any).socket.server);
    ;(res as any).socket.server.io = io;

    io.on('connection', socket => {
      console.log('WS Connected:', socket.id);
    });
  }
  res.end();
}
