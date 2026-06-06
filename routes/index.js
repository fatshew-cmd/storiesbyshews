const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

function mapAnnouncements(announcements) {
  return announcements.map((announcement) => ({
    message: announcement.message,
    link: announcement.linkUrl,
    cta: announcement.anchorText || 'See more',
    status: announcement.status,
  }));
}

router.get('/', async (req, res, next) => {
  try {
    const announcements = await Announcement.find({
      status: 'published',
    })
      .sort({ weight: -1, createdAt: -1 })
      .lean();

    res.render('index', {
      title: 'Stories by Shews',
      announcements: mapAnnouncements(announcements),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/creative-directors', async (req, res, next) => {
  try {
    const announcements = await Announcement.find({
      status: 'published',
    })
      .sort({ weight: -1, createdAt: -1 })
      .lean();

    res.render('beings', {
      title: 'Creative Directors | Stories by Shews',
      announcements: mapAnnouncements(announcements),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/beings', (req, res) => {
  res.redirect('/creative-directors');
});

module.exports = router;
