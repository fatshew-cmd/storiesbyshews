const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema(
  {
    stringId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    seasonNumber: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    startsAt: {
      type: Date,
      default: null,
    },
    endsAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'seasons',
  }
);

seasonSchema.index({ seasonNumber: 1, status: 1 });

module.exports = mongoose.models.Season || mongoose.model('Season', seasonSchema);
