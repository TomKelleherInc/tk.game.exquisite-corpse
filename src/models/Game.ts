import mongoose, { Document, Model } from 'mongoose';

export interface IGame extends Document {
  gameId: string;
  createdAt: Date;
  players: string[];
  status: 'waiting' | 'in_progress' | 'complete';
}

const GameSchema = new mongoose.Schema<IGame>({
  gameId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: () => new Date() },
  players: { type: [String], default: [] },
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'complete'],
    default: 'waiting',
  },
});

export const Game: Model<IGame> =
  mongoose.models.Game || mongoose.model<IGame>('Game', GameSchema);
