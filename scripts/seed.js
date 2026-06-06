require('dotenv').config();
const mongoose = require('mongoose');

const Admin = require('../models/Admin');
const User = require('../models/User');
const Persona = require('../models/Persona');
const Season = require('../models/Season');
const Episode = require('../models/Episode');
const Announcement = require('../models/Announcement');

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required to run the seed script.');
  }

  await mongoose.connect(process.env.MONGO_URI);

  await Promise.all([
    Admin.deleteMany({}),
    User.deleteMany({}),
    Persona.deleteMany({}),
    Season.deleteMany({}),
    Episode.deleteMany({}),
    Announcement.deleteMany({}),
  ]);

  const [admin] = await Admin.create([
    {
      email: 'owner@storiesbyshews.com',
      displayName: 'Stories by Shews',
      role: 'super_admin',
      status: 'published',
    },
  ]);

  const [user] = await User.create([
    {
      email: 'reader@storiesbyshews.com',
      displayName: 'First Reader',
      username: 'firstreader',
      status: 'published',
    },
  ]);

  const [michelle, riley] = await Persona.create([
    {
      stringId: 'michelle',
      slug: 'michelle',
      name: 'Michelle',
      personaType: 'figure',
      tagline: 'Quiet confidence with a soft edge.',
      shortBio: 'A polished founder-published figure with a contemplative presence.',
      longBio: 'Michelle is a founder-published fictional figure designed for intimate, character-first storytelling.',
      tags: ['portrait', 'turquoise hair', 'sorority'],
      images: [
        {
          url: 'https://example.com/personas/michelle-hero.jpg',
          alt: 'Michelle hero portrait',
          kind: 'hero',
        },
      ],
      teaseAudio: {
        url: 'https://example.com/audio/michelle-tease.mp3',
        durationSeconds: 10,
      },
      status: 'published',
      searchAliases: ['michelle', 'mimi'],
    },
    {
      stringId: 'riley',
      slug: 'riley',
      name: 'Riley',
      personaType: 'figure',
      tagline: 'Playful energy with a restless curiosity.',
      shortBio: 'A magnetic founder-published figure built for layered scenes and evolving dynamics.',
      longBio: 'Riley brings motion and unpredictability into the founder-owned Stories by Shews world.',
      tags: ['editorial', 'nightlife', 'soft glam'],
      images: [
        {
          url: 'https://example.com/personas/riley-hero.jpg',
          alt: 'Riley hero portrait',
          kind: 'hero',
        },
      ],
      teaseAudio: {
        url: 'https://example.com/audio/riley-tease.mp3',
        durationSeconds: 12,
      },
      status: 'published',
      searchAliases: ['riley'],
    },
  ]);

  const [seasonOne] = await Season.create([
    {
      stringId: 'season-1',
      title: 'Season 1',
      seasonNumber: 1,
      description: 'Opening chapter of the Stories by Shews universe.',
      status: 'published',
    },
  ]);

  await Episode.create([
    {
      stringId: 'late-night-confession',
      slug: 'late-night-confession',
      title: 'Late Night Confession',
      seasonId: seasonOne._id,
      episodeNumber: 1,
      personaIds: [michelle._id, riley._id],
      synopsis: 'A charged exchange opens the season with both figures in frame.',
      storyBody: 'Seed episode body placeholder.',
      teaseAudio: {
        url: 'https://example.com/audio/late-night-confession.mp3',
        durationSeconds: 10,
      },
      coverImageUrl: 'https://example.com/episodes/late-night-confession.jpg',
      status: 'published',
      publishedAt: new Date(),
    },
  ]);

  await Announcement.create([
    {
      title: 'Season 1 Live',
      message: 'Season 1 is live. Unlock founder stories, audio drops, and podcasts with tokens.',
      anchorText: 'Enter the story',
      linkUrl: '/r/late-night-confession',
      status: 'published',
      placement: 'global_banner',
      weight: 0,
    },
    {
      title: 'Creative Directors',
      message: 'Creative director applications are founder-reviewed before any profile goes live.',
      anchorText: 'Explore creative directors',
      linkUrl: '/creative-directors',
      status: 'draft',
      placement: 'homepage',
      weight: 1,
    },
  ]);

  user.favorites = [michelle._id];
  await user.save();

  console.log(
    `Seed complete: admin=${admin.email}, profiles=${[michelle.name, riley.name].join(', ')}`
  );
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
