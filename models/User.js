const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Persona',
      },
    ],
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
