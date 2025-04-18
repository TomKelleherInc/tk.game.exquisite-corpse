// src/pages/api/games/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/lib/mongodb'  // '../../../../lib/mongodb';
import { Game } from '@/models/Game';
import { customAlphabet } from 'nanoid';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const nanoid = customAlphabet(alphabet, 9);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connect();

  // Generate a unique ID, retrying on collision
  let gameId: string;
  let exists: boolean;
  do {
    gameId = nanoid().match(/.{3}/g)!.join('-'); // e.g. "ABC-DEF-GHI"
    exists = await Game.exists({ gameId });
  } while (exists);

  const game = new Game({ gameId });
  await game.save();

  const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/game/${gameId}`;

  return res.status(201).json({ gameId, inviteLink });
}
