// src/pages/api/games/[id]/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/lib/mongodb';
import { Game } from '@/models/Game';
import { Panel } from '@/models/Panel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { id: gameId },
    method,
  } = req;

  if (method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (typeof gameId !== 'string') return res.status(400).json({ error: 'Invalid game ID' });

  await connect();

  const game = await Game.findOne({ gameId }).lean();
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const panels = await Panel.find({ gameId }).sort('panelNumber').lean();

  return res.status(200).json({
    gameId:  game.gameId,
    players: game.players,
    status:  game.status,
    panels:  panels.map(p => ({
      panelNumber: p.panelNumber,
      claimedBy:   p.claimedBy,
      status:      p.status,
      imageData:   p.imageData,    // may be undefined for unsubmitted
    })),
  });
}
