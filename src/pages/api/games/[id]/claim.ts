// src/pages/api/games/[id]/claim.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Server as IoServer } from 'socket.io';
import connect from '@/lib/mongodb';
import { Game } from '@/models/Game';
import { Panel } from '@/models/Panel';

//export const config = { api: { bodyParser: false } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id: gameId } = req.query;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (typeof gameId !== 'string') {
    return res.status(400).json({ error: 'Invalid game ID' });
  }
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required' });
  }

  await connect();

  // Verify game exists
  const game = await Game.findOne({ gameId });
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  // Determine next panel
  const count = await Panel.countDocuments({ gameId });
  const nextPanelNumber = count + 1;

  // Create panel
  const panel = new Panel({ gameId, panelNumber: nextPanelNumber, claimedBy: name, status: 'claimed' });
  await panel.save();

  // Flip game status on first claim
  if (game.status === 'waiting') {
    game.status = 'in_progress';
    await game.save();
  }

  // --- SOCKET.IO INIT & EMIT ---
  const srv = (res.socket as any).server;
  if (!srv.io) {
    // First time: instantiate
    const io = new IoServer(srv);
    // Optional: set up any listeners here
    io.on('connection', socket => {
      console.log('WS connected', socket.id);
    });
    srv.io = io;
  }
  // Now emit
  srv.io.emit('panelClaimed', {
    gameId,
    panelNumber: nextPanelNumber,
    claimedBy: name,
  });

  return res.status(201).json({
    gameId,
    panel: {
      panelNumber: nextPanelNumber,
      claimedBy: name,
      status: panel.status,
    },
  });
}
