// src/pages/api/games/[id]/join.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/lib/mongodb';
import { Game } from '@/models/Game';

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

  const game = await Game.findOne({ gameId });
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  // Prevent the same name joining twice
  if (!game.players.includes(name)) {
    game.players.push(name);
    await game.save();
  }

  return res.status(200).json({
    gameId: game.gameId,
    players: game.players,
    status: game.status,
  });
}
