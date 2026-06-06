const mongoose = require('mongoose');

const episodeAudioSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
      default: '',
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const episodeSchema = new mongoose.Schema(
  {
    stringId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    slug: {
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
    seasonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Season',
      required: true,
      index: true,
    },
    episodeNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    personaIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Persona',
        required: true,
      },
    ],
    synopsis: {
      type: String,
      trim: true,
      default: '',
    },
    storyBody: {
      type: String,
      trim: true,
      default: '',
    },
    teaseAudio: {
      type: episodeAudioSchema,
      default: () => ({}),
    },
    coverImageUrl: {
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
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'episodes',
  }
);

episodeSchema.path('personaIds').validate(
  (value) => Array.isArray(value) && value.length > 0,
  'An episode must belong to at least one persona.'
);

episodeSchema.index({ title: 'text', stringId: 'text' });
episodeSchema.index({ seasonId: 1, episodeNumber: 1 }, { unique: true });

module.exports = mongoose.models.Episode || mongoose.model('Episode', episodeSchema);
