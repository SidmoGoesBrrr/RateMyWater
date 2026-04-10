import mongoose, { Schema, Document } from "mongoose";

export interface IReply {
  body: string;
  author: string;
  createdAt: Date;
}

export interface IForumPost extends Document {
  title: string;
  body: string;
  author: string;
  waterBodyId?: string;
  waterBodyName?: string;
  tags: string[];
  replies: IReply[];
  upvotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema<IReply>({
  body: { type: String, required: true, maxlength: 1000 },
  author: { type: String, default: "Anonymous", maxlength: 50 },
  createdAt: { type: Date, default: Date.now },
});

const ForumPostSchema = new Schema<IForumPost>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    body: { type: String, required: true, maxlength: 2000 },
    author: { type: String, default: "Anonymous", maxlength: 50 },
    waterBodyId: { type: String },
    waterBodyName: { type: String, maxlength: 100 },
    tags: [{ type: String, maxlength: 30 }],
    replies: [ReplySchema],
    upvotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.ForumPost ||
  mongoose.model<IForumPost>("ForumPost", ForumPostSchema);
