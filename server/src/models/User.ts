import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  githubId: string;
  username: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  githubId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    sparse: true
  },
  name: {
    type: String
  },
  avatarUrl: {
    type: String
  }
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', userSchema);
