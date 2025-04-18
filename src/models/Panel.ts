import mongoose, { Document, Model } from 'mongoose';

export interface IPanel extends Document {
  gameId: string;
  panelNumber: number;
  claimedBy: string;
  status: 'claimed' | 'submitted';
  imageData?: string;
  createdAt: Date;
}

const PanelSchema = new mongoose.Schema<IPanel>({
   gameId:       { type: String, required: true, index: true },
   panelNumber:  { type: Number, required: true },
   claimedBy:    { type: String, required: true },
   status:       { type: String, enum: ['claimed','submitted'], default: 'claimed' },
   imageData:    { type: String },
   createdAt:    { type: Date, default: () => new Date() },
 });

// Ensure each gameId+panelNumber is unique
PanelSchema.index({ gameId: 1, panelNumber: 1 }, { unique: true });

export const Panel: Model<IPanel> =
  mongoose.models.Panel || mongoose.model<IPanel>('Panel', PanelSchema);
