const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  text:     { type: String, required: true },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  authorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String },
  type:       { type: String, enum: ['meal', 'tip', 'recipe', 'transformation'], required: true },
  content:    { type: String, required: true },
  images:     [String],
  tags:       [String],
  likes:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments:   [commentSchema],
  shares:     { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
