const mongoose = require('mongoose');

const personaImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    alt: {
      type: String,
      trim: true,
      default: '',
    },
    kind: {
      type: String,
      enum: ['hero', 'gallery', 'thumbnail'],
      default: 'gallery',
    },
  },
  { _id: false }
);

const personaAudioSchema = new mongoose.Schema(
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

const personaSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    personaType: {
      type: String,
      enum: ['being', 'figure'],
      required: true,
      index: true,
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
    },
    shortBio: {
      type: String,
      trim: true,
      default: '',
    },
    longBio: {
      type: String,
      trim: true,
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [personaImageSchema],
    teaseAudio: {
      type: personaAudioSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    searchAliases: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
    collection: 'personas',
  }
);

personaSchema.index({ name: 'text', stringId: 'text', searchAliases: 'text' });

module.exports = mongoose.models.Persona || mongoose.model('Persona', personaSchema);
