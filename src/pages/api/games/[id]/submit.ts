// src/pages/api/games/[id]/submit.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/lib/mongodb';
import { Panel } from '@/models/Panel';

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

  const { name, imageData } = req.body as {
    name?: string;
    imageData?: string;
  };
  if (!name || !imageData) {
    return res.status(400).json({ error: 'Name and imageData are required' });
  }

  await connect();

  // Find the claimed panel for this user
  const panel = await Panel.findOne({
    gameId,
    claimedBy: name,
    status: 'claimed',
  });
  if (!panel) {
    return res.status(404).json({ error: 'No claimed panel found' });
  }

  // Update to submitted
  panel.status = 'submitted';
  panel.imageData = imageData;
  await panel.save();

  // Emit via Socket.io
  const srv = (res.socket as any).server;
  if (srv.io) {
    srv.io.emit('panelSubmitted', {
      gameId,
      panelNumber: panel.panelNumber,
      claimedBy: name,
    });
  }

  return res.status(200).json({
    gameId,
    panel: {
      panelNumber: panel.panelNumber,
      status: 'submitted',
    },
  });
}
