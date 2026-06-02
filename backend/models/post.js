const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  content: { type: String, required: true, maxlength: 2000 },
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ salon: 1, createdAt: -1 });

postSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Post', postSchema);
