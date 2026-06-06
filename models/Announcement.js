const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    anchorText: {
      type: String,
      trim: true,
      default: 'See more',
    },
    linkUrl: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
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
    placement: {
      type: String,
      enum: ['global_banner', 'homepage', 'persona', 'episode'],
      default: 'global_banner',
    },
    weight: {
      type: Number,
      default: 0,
      min: -5,
      max: 10,
      validate: {
        validator: Number.isInteger,
        message: 'Weight must be a whole number.',
      },
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
    collection: 'announcements',
  }
);

announcementSchema.index({ status: 1, weight: -1, createdAt: -1 });

module.exports =
  mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
