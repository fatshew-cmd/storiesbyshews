const crypto = require('crypto');
const express = require('express');

const Announcement = require('../models/Announcement');
const Episode = require('../models/Episode');
const Persona = require('../models/Persona');
const Season = require('../models/Season');

const router = express.Router();

const ADMIN_COOKIE_NAME = 'author_admin_session';
const STATUS_OPTIONS = ['draft', 'published', 'archived'];
const PERSONA_TYPE_OPTIONS = ['being', 'figure'];
const PERSONA_TYPE_LABELS = {
  figure: 'Fictional figure',
  being: 'Represented being',
};
const ANNOUNCEMENT_PLACEMENTS = ['global_banner', 'homepage', 'persona', 'episode'];

function getAdminAccessKey() {
  return process.env.ADMIN_ACCESS_KEY || 'storiesbyshews-local-admin';
}

function isUsingFallbackAccessKey() {
  return !process.env.ADMIN_ACCESS_KEY;
}

function getAuthToken() {
  return crypto.createHash('sha256').update(getAdminAccessKey()).digest('hex');
}

function parseCookies(req) {
  const header = req.headers.cookie || '';

  return header.split(';').reduce((cookies, part) => {
    const [rawName, ...rawValueParts] = part.trim().split('=');

    if (!rawName) {
      return cookies;
    }

    cookies[rawName] = decodeURIComponent(rawValueParts.join('=') || '');
    return cookies;
  }, {});
}

function isAuthenticated(req) {
  const cookies = parseCookies(req);
  const cookieValue = cookies[ADMIN_COOKIE_NAME];

  if (!cookieValue) {
    return false;
  }

  const expected = Buffer.from(getAuthToken(), 'utf8');
  const actual = Buffer.from(cookieValue, 'utf8');

  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function setAuthCookie(res) {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    `${ADMIN_COOKIE_NAME}=${encodeURIComponent(getAuthToken())}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=28800',
  ];

  if (secure) {
    parts.push('Secure');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearAuthCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

function requireAdmin(req, res, next) {
  if (!isAuthenticated(req)) {
    return res.redirect('/admin/login');
  }

  return next();
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function splitCommaSeparated(value) {
  return normalizeText(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(value) {
  return normalizeText(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTextList(value, allowedValues = null) {
  const rawValues = Array.isArray(value) ? value : [value];
  const normalized = rawValues
    .flatMap((item) => normalizeText(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);

  const uniqueValues = [...new Set(normalized)];

  if (!allowedValues) {
    return uniqueValues;
  }

  return uniqueValues.filter((item) => allowedValues.includes(item));
}

function normalizeDate(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function redirectToAdmin(res, options = {}) {
  const params = new URLSearchParams();

  if (options.editKey && options.edit) {
    params.set(options.editKey, options.edit);
  }

  if (options.notice) {
    params.set('notice', options.notice);
  }

  if (options.tone) {
    params.set('tone', options.tone);
  }

  const query = params.toString();
  res.redirect(`${options.path || '/admin'}${query ? `?${query}` : ''}`);
}

function redirectWithoutQuery(res, path) {
  res.redirect(path);
}

function buildPersonaImages(body) {
  const heroUrl = normalizeText(body.heroImageUrl);
  const heroAlt = normalizeText(body.heroImageAlt);
  const galleryLines = splitLines(body.galleryImageUrls);
  const galleryAltLines = splitLines(body.galleryImageAlts);
  const images = [];

  if (heroUrl) {
    images.push({
      url: heroUrl,
      alt: heroAlt || `${normalizeText(body.name) || 'Profile'} hero image`,
      kind: 'hero',
    });
  }

  galleryLines.forEach((url, index) => {
    images.push({
      url,
      alt: galleryAltLines[index] || `${normalizeText(body.name) || 'Profile'} gallery image ${index + 1}`,
      kind: index === 0 && !heroUrl ? 'thumbnail' : 'gallery',
    });
  });

  return images;
}

function toPersonaForm(persona) {
  if (!persona) {
    return {
      id: '',
      stringId: '',
      slug: '',
      name: '',
      personaType: 'figure',
      tagline: '',
      shortBio: '',
      longBio: '',
      status: 'draft',
      tags: '',
      searchAliases: '',
      heroImageUrl: '',
      heroImageAlt: '',
      galleryImageUrls: '',
      galleryImageAlts: '',
      teaseAudioUrl: '',
      teaseAudioDurationSeconds: 0,
    };
  }

  const heroImage = (persona.images || []).find((image) => image.kind === 'hero') || persona.images?.[0];
  const galleryImages = (persona.images || []).filter((image) => image !== heroImage);

  return {
    id: String(persona._id),
    stringId: persona.stringId || '',
    slug: persona.slug || '',
    name: persona.name || '',
    personaType: persona.personaType || 'figure',
    tagline: persona.tagline || '',
    shortBio: persona.shortBio || '',
    longBio: persona.longBio || '',
    status: persona.status || 'draft',
    tags: (persona.tags || []).join(', '),
    searchAliases: (persona.searchAliases || []).join(', '),
    heroImageUrl: heroImage?.url || '',
    heroImageAlt: heroImage?.alt || '',
    galleryImageUrls: galleryImages.map((image) => image.url).join('\n'),
    galleryImageAlts: galleryImages.map((image) => image.alt || '').join('\n'),
    teaseAudioUrl: persona.teaseAudio?.url || '',
    teaseAudioDurationSeconds: persona.teaseAudio?.durationSeconds || 0,
  };
}

function toSeasonForm(season) {
  if (!season) {
    return {
      id: '',
      stringId: '',
      title: '',
      seasonNumber: 1,
      description: '',
      status: 'draft',
      startsAt: '',
      endsAt: '',
    };
  }

  return {
    id: String(season._id),
    stringId: season.stringId || '',
    title: season.title || '',
    seasonNumber: season.seasonNumber || 1,
    description: season.description || '',
    status: season.status || 'draft',
    startsAt: season.startsAt ? new Date(season.startsAt).toISOString().slice(0, 16) : '',
    endsAt: season.endsAt ? new Date(season.endsAt).toISOString().slice(0, 16) : '',
  };
}

function toAnnouncementForm(announcement) {
  if (!announcement) {
    return {
      id: '',
      title: '',
      message: '',
      anchorText: 'See more',
      linkUrl: '',
      imageUrl: '',
      placement: 'global_banner',
      weight: 0,
      status: 'draft',
      startsAt: '',
      endsAt: '',
    };
  }

  return {
    id: String(announcement._id),
    title: announcement.title || '',
    message: announcement.message || '',
    anchorText: announcement.anchorText || 'See more',
    linkUrl: announcement.linkUrl || '',
    imageUrl: announcement.imageUrl || '',
    placement: announcement.placement || 'global_banner',
    weight: announcement.weight || 0,
    status: announcement.status || 'draft',
    startsAt: announcement.startsAt ? new Date(announcement.startsAt).toISOString().slice(0, 16) : '',
    endsAt: announcement.endsAt ? new Date(announcement.endsAt).toISOString().slice(0, 16) : '',
  };
}

function formatAdminDateTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPlacementLabel(value) {
  const placement = normalizeText(value);

  if (!placement) {
    return 'Unknown';
  }

  return placement
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getAnnouncementLifecycle(announcement, now = new Date()) {
  const startsAt = announcement.startsAt ? new Date(announcement.startsAt) : null;
  const endsAt = announcement.endsAt ? new Date(announcement.endsAt) : null;
  const hasStarted = !startsAt || startsAt <= now;
  const hasEnded = Boolean(endsAt && endsAt < now);
  const startsInFuture = Boolean(startsAt && startsAt > now);

  if (announcement.status === 'archived') {
    return 'archived';
  }

  if (announcement.status === 'draft') {
    return 'draft';
  }

  if (hasEnded) {
    return 'expired';
  }

  if (startsInFuture) {
    return 'scheduled';
  }

  if (hasStarted) {
    return 'live';
  }

  return announcement.status || 'draft';
}

function getAnnouncementScheduleLabel(announcement, lifecycle) {
  const startsAtLabel = formatAdminDateTime(announcement.startsAt);
  const endsAtLabel = formatAdminDateTime(announcement.endsAt);

  if (lifecycle === 'live') {
    if (endsAtLabel) {
      return `Live until ${endsAtLabel}`;
    }

    return startsAtLabel ? `Live since ${startsAtLabel}` : 'Live with no end date';
  }

  if (lifecycle === 'scheduled') {
    if (startsAtLabel && endsAtLabel) {
      return `${startsAtLabel} to ${endsAtLabel}`;
    }

    if (startsAtLabel) {
      return `Starts ${startsAtLabel}`;
    }
  }

  if (lifecycle === 'expired') {
    return endsAtLabel ? `Ended ${endsAtLabel}` : 'Expired';
  }

  if (startsAtLabel && endsAtLabel) {
    return `${startsAtLabel} to ${endsAtLabel}`;
  }

  if (startsAtLabel) {
    return `Starts ${startsAtLabel}`;
  }

  if (endsAtLabel) {
    return `Ends ${endsAtLabel}`;
  }

  return 'No schedule set';
}

function buildAnnouncementAttention(announcement, lifecycle, now = new Date()) {
  const attention = [];
  const startsAt = announcement.startsAt ? new Date(announcement.startsAt) : null;
  const endsAt = announcement.endsAt ? new Date(announcement.endsAt) : null;
  const msIn48Hours = 48 * 60 * 60 * 1000;

  if (announcement.status === 'published' && !endsAt) {
    attention.push('No end date');
  }

  if (announcement.status === 'published' && endsAt && endsAt < now) {
    attention.push('Expired while published');
  }

  if (announcement.status === 'published' && startsAt && endsAt && startsAt > endsAt) {
    attention.push('Schedule is invalid');
  }

  if (lifecycle === 'live' && endsAt && endsAt.getTime() - now.getTime() <= msIn48Hours) {
    attention.push('Ending soon');
  }

  if (!normalizeText(announcement.linkUrl)) {
    attention.push('Missing URL');
  }

  return attention;
}

function getAnnouncementWindow(announcement) {
  const start = announcement.startsAt ? new Date(announcement.startsAt).getTime() : Number.NEGATIVE_INFINITY;
  const end = announcement.endsAt ? new Date(announcement.endsAt).getTime() : Number.POSITIVE_INFINITY;

  return { start, end };
}

function buildAnnouncementAlerts(announcements, now = new Date()) {
  const publishedAnnouncements = announcements.filter((item) => item.status === 'published');
  const endingSoonCount = publishedAnnouncements.filter((item) => {
    if (!item.endsAt) {
      return false;
    }

    const endsAt = new Date(item.endsAt).getTime();
    const diff = endsAt - now.getTime();
    return diff > 0 && diff <= 48 * 60 * 60 * 1000;
  }).length;

  const publishedWithoutEndDateCount = publishedAnnouncements.filter((item) => !item.endsAt).length;
  const expiredPublishedCount = publishedAnnouncements.filter((item) => {
    return item.endsAt && new Date(item.endsAt) < now;
  }).length;

  const overlapCounts = ANNOUNCEMENT_PLACEMENTS.map((placement) => {
    const placementAnnouncements = publishedAnnouncements
      .filter((item) => item.placement === placement)
      .sort((left, right) => {
        const leftWindow = getAnnouncementWindow(left);
        const rightWindow = getAnnouncementWindow(right);
        return leftWindow.start - rightWindow.start;
      });

    let overlaps = 0;

    for (let index = 0; index < placementAnnouncements.length; index += 1) {
      const currentWindow = getAnnouncementWindow(placementAnnouncements[index]);

      for (let compareIndex = index + 1; compareIndex < placementAnnouncements.length; compareIndex += 1) {
        const compareWindow = getAnnouncementWindow(placementAnnouncements[compareIndex]);

        if (compareWindow.start > currentWindow.end) {
          break;
        }

        if (currentWindow.start <= compareWindow.end && compareWindow.start <= currentWindow.end) {
          overlaps += 1;
        }
      }
    }

    return { placement, overlaps };
  }).filter((item) => item.overlaps > 0);

  const alerts = [];

  if (endingSoonCount) {
    alerts.push({
      tone: 'warn',
      text: `${endingSoonCount} announcement${endingSoonCount === 1 ? '' : 's'} end within 48 hours.`,
    });
  }

  if (publishedWithoutEndDateCount) {
    alerts.push({
      tone: 'info',
      text: `${publishedWithoutEndDateCount} published announcement${publishedWithoutEndDateCount === 1 ? ' has' : 's have'} no end date.`,
    });
  }

  if (expiredPublishedCount) {
    alerts.push({
      tone: 'danger',
      text: `${expiredPublishedCount} published announcement${expiredPublishedCount === 1 ? ' is' : 's are'} already expired.`,
    });
  }

  overlapCounts.forEach((item) => {
    alerts.push({
      tone: 'warn',
      text: `${item.overlaps} overlap${item.overlaps === 1 ? '' : 's'} detected in ${formatPlacementLabel(item.placement)} placement.`,
    });
  });

  return alerts;
}

function buildAnnouncementQuery(baseQuery, overrides = {}) {
  const params = new URLSearchParams();
  const values = {
    q: normalizeText(baseQuery.q),
    status: Array.isArray(baseQuery.status) ? baseQuery.status : normalizeTextList(baseQuery.status),
    placement: Array.isArray(baseQuery.placement) ? baseQuery.placement : normalizeTextList(baseQuery.placement),
    attention: Array.isArray(baseQuery.attention) ? baseQuery.attention : normalizeTextList(baseQuery.attention),
    editAnnouncement: normalizeText(baseQuery.editAnnouncement),
    composeAnnouncement: normalizeText(baseQuery.composeAnnouncement),
    ...overrides,
  };

  Object.entries(values).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      const normalizedList = normalizeTextList(value);

      if (normalizedList.length) {
        params.set(key, normalizedList.join(','));
      }

      return;
    }

    const normalized = normalizeText(value);

    if (normalized) {
      params.set(key, normalized);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

function toEpisodeForm(episode) {
  if (!episode) {
    return {
      id: '',
      stringId: '',
      slug: '',
      title: '',
      seasonId: '',
      episodeNumber: 1,
      personaIds: [],
      synopsis: '',
      storyBody: '',
      coverImageUrl: '',
      status: 'draft',
      teaseAudioUrl: '',
      teaseAudioDurationSeconds: 0,
      publishedAt: '',
    };
  }

  return {
    id: String(episode._id),
    stringId: episode.stringId || '',
    slug: episode.slug || '',
    title: episode.title || '',
    seasonId: episode.seasonId?._id ? String(episode.seasonId._id) : String(episode.seasonId || ''),
    episodeNumber: episode.episodeNumber || 1,
    personaIds: (episode.personaIds || []).map((persona) =>
      String(persona._id ? persona._id : persona)
    ),
    synopsis: episode.synopsis || '',
    storyBody: episode.storyBody || '',
    coverImageUrl: episode.coverImageUrl || '',
    status: episode.status || 'draft',
    teaseAudioUrl: episode.teaseAudio?.url || '',
    teaseAudioDurationSeconds: episode.teaseAudio?.durationSeconds || 0,
    publishedAt: episode.publishedAt ? new Date(episode.publishedAt).toISOString().slice(0, 16) : '',
  };
}

function buildAdminBase(req, pageKey) {
  const rawNotice = normalizeText(req.query.notice);
  const notice = /^signed\s*in$/i.test(rawNotice) ? '' : rawNotice;
  const adminNavGroups = [
    {
      label: 'Dashboard',
      items: [
        { key: 'overview', label: 'Overview', href: '/admin' },
        { key: 'statistics', label: 'Statistics', href: '/admin/statistics' },
        { key: 'management', label: 'Management', href: '/admin/management' },
      ],
    },
    {
      label: 'Publishing',
      items: [
        { key: 'stories', label: 'Stories & Audio', href: '/admin/stories' },
        { key: 'personas', label: 'Profiles', href: '/admin/personas' },
        { key: 'forms', label: 'Application Forms', href: '/admin/forms' },
      ],
    },
    {
      label: 'Applications',
      items: [
        { key: 'announcements', label: 'Announcements', href: '/admin/announcements' },
        { key: 'auditions', label: 'Applications', href: '/admin/auditions' },
        { key: 'mailbox', label: 'Mailbox', href: '/admin/mailbox' },
        { key: 'flags', label: 'Flags', href: '/admin/flags' },
      ],
    },
    {
      label: 'Preferences',
      items: [{ key: 'settings', label: 'Settings', href: '/admin/settings' }],
    },
  ];

  return {
    currentPage: pageKey,
    adminNavGroups,
    notice,
    noticeTone: req.query.tone === 'error' ? 'error' : 'success',
    usingFallbackAccessKey: isUsingFallbackAccessKey(),
    statusClasses: {
      draft: 'bg-silver-100 text-silver-800',
      published: 'bg-[#e9f9ee] text-[#166534]',
      archived: 'bg-[#f8e8e8] text-[#8c3131]',
    },
  };
}

async function loadAdminCollections() {
  const [announcements, personas, seasons, episodes] = await Promise.all([
    Announcement.find().sort({ updatedAt: -1 }).lean(),
    Persona.find().sort({ updatedAt: -1 }).lean(),
    Season.find().sort({ seasonNumber: 1, updatedAt: -1 }).lean(),
    Episode.find()
      .populate('seasonId', 'title seasonNumber')
      .populate('personaIds', 'name stringId')
      .sort({ updatedAt: -1 })
      .lean(),
  ]);

  return { announcements, personas, seasons, episodes };
}

async function renderOverview(req, res, next) {
  try {
    const { announcements, personas, seasons, episodes } = await loadAdminCollections();

    const recentUpdates = [...announcements, ...personas, ...seasons, ...episodes]
      .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
      .slice(0, 8)
      .map((item) => ({
        id: String(item._id),
        title:
          item.title ||
          item.name ||
          item.message?.slice(0, 60) ||
          item.stringId ||
          'Untitled item',
        status: item.status,
        updatedAt: item.updatedAt,
        kind: item.placement ? 'announcement' : item.personaType ? 'profile' : item.seasonNumber ? 'season' : 'episode',
      }));

    res.render('admin/overview', {
      title: 'Founder Console | Stories by Shews',
      ...buildAdminBase(req, 'overview'),
      overviewCards: [
        { label: 'Announcements', value: announcements.length, hint: 'Sitewide promo inventory' },
        { label: 'Profiles', value: personas.length, hint: 'Figures and represented beings' },
        { label: 'Seasons', value: seasons.length, hint: 'Founder-managed story arcs' },
        { label: 'Episodes', value: episodes.length, hint: `${episodes.filter((episode) => episode.status === 'published').length} founder-published live` },
      ],
      recentUpdates,
    });
  } catch (error) {
    next(error);
  }
}

async function renderStories(req, res, next) {
  try {
    const { personas, seasons, episodes } = await loadAdminCollections();

    res.render('admin/stories', {
      title: 'Stories & Audio | Stories by Shews',
      ...buildAdminBase(req, 'stories'),
      personas,
      seasons,
      episodes,
      forms: {
        persona: toPersonaForm(personas.find((item) => String(item._id) === normalizeText(req.query.editPersona))),
        season: toSeasonForm(seasons.find((item) => String(item._id) === normalizeText(req.query.editSeason))),
        episode: toEpisodeForm(episodes.find((item) => String(item._id) === normalizeText(req.query.editEpisode))),
      },
      options: {
        statuses: STATUS_OPTIONS,
        personaTypes: PERSONA_TYPE_OPTIONS,
        personaTypeLabels: PERSONA_TYPE_LABELS,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function renderAnnouncements(req, res, next) {
  try {
    const { announcements } = await loadAdminCollections();
    const now = new Date();
    const query = {
      q: normalizeText(req.query.q),
      status: normalizeTextList(req.query.status, STATUS_OPTIONS),
      placement: normalizeTextList(req.query.placement, ANNOUNCEMENT_PLACEMENTS),
      attention: normalizeTextList(req.query.attention, ['attention']),
    };
    const editAnnouncementId = normalizeText(req.query.editAnnouncement);
    const composeAnnouncement = normalizeText(req.query.composeAnnouncement) === '1';
    const announcementRows = announcements.map((announcement) => {
      const lifecycle = getAnnouncementLifecycle(announcement, now);
      const attention = buildAnnouncementAttention(announcement, lifecycle, now);

      return {
        ...announcement,
        lifecycle,
        lifecycleLabel: lifecycle.charAt(0).toUpperCase() + lifecycle.slice(1),
        lifecycleTone:
          lifecycle === 'live'
            ? 'bg-[#e8f7ff] text-[#0f4c81]'
            : lifecycle === 'scheduled'
              ? 'bg-[#fff5dd] text-[#8a5a00]'
              : lifecycle === 'expired'
                ? 'bg-[#fbeaea] text-[#9b2d2d]'
                : 'bg-silver-100 text-silver-800',
        placementLabel: formatPlacementLabel(announcement.placement),
        scheduleLabel: getAnnouncementScheduleLabel(announcement, lifecycle),
        updatedAtLabel: formatAdminDateTime(announcement.updatedAt),
        attention,
      };
    });
    const filteredAnnouncements = announcementRows.filter((announcement) => {
      if (query.status.length && !query.status.includes(announcement.status)) {
        return false;
      }

      if (query.placement.length && !query.placement.includes(announcement.placement)) {
        return false;
      }

      if (query.attention.includes('attention') && !announcement.attention.length) {
        return false;
      }

      if (query.q) {
        const haystack = [
          announcement.title,
          announcement.message,
          announcement.linkUrl,
          announcement.anchorText,
        ]
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(query.q.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
    const announcementBeingEdited =
      !composeAnnouncement &&
      announcements.find((item) => String(item._id) === editAnnouncementId);
    const summaryCards = [
      {
        label: 'Live now',
        value: announcementRows.filter((item) => item.lifecycle === 'live').length,
        hint: 'Currently visible published messaging',
      },
      {
        label: 'Scheduled',
        value: announcementRows.filter((item) => item.lifecycle === 'scheduled').length,
        hint: 'Published announcements with future start dates',
      },
      {
        label: 'Drafts',
        value: announcementRows.filter((item) => item.status === 'draft').length,
        hint: 'Still being written or reviewed',
      },
      {
        label: 'Needs attention',
        value: announcementRows.filter((item) => item.attention.length).length,
        hint: 'Broken timing, missing end dates, or expiring soon',
      },
    ];

    res.render('admin/announcements', {
      title: 'Announcements Admin | Stories by Shews',
      ...buildAdminBase(req, 'announcements'),
      announcements: filteredAnnouncements,
      announcementCount: announcements.length,
      summaryCards,
      alerts: buildAnnouncementAlerts(announcements, now),
      forms: {
        announcement: toAnnouncementForm(announcementBeingEdited),
      },
      composeAnnouncement,
      filterQuery: buildAnnouncementQuery(query),
      currentFilters: query,
      options: {
        statuses: STATUS_OPTIONS,
        placements: ANNOUNCEMENT_PLACEMENTS,
      },
    });
  } catch (error) {
    next(error);
  }
}

function renderAuditions(req, res) {
  res.render('admin/auditions', {
    title: 'Applications | Stories by Shews',
    ...buildAdminBase(req, 'auditions'),
  });
}

function renderStatistics(req, res) {
  res.render('admin/simple-page', {
    title: 'Statistics Admin | Stories by Shews',
    ...buildAdminBase(req, 'statistics'),
    pageEyebrow: 'Dashboard',
    pageTitle: 'Statistics',
    pageBody: 'Statistics will live here once the reporting layer is wired into the admin.',
  });
}

function renderManagement(req, res) {
  res.render('admin/simple-page', {
    title: 'Management Admin | Stories by Shews',
    ...buildAdminBase(req, 'management'),
    pageEyebrow: 'Dashboard',
    pageTitle: 'Management',
    pageBody: 'Management tools can live here as the admin surface expands.',
  });
}

async function renderPersonas(req, res, next) {
  try {
    const { personas } = await loadAdminCollections();

    res.render('admin/personas', {
      title: 'Profiles | Stories by Shews',
      ...buildAdminBase(req, 'personas'),
      personas,
      forms: {
        persona: toPersonaForm(
          personas.find((item) => String(item._id) === normalizeText(req.query.editPersona))
        ),
      },
      options: {
        statuses: STATUS_OPTIONS,
        personaTypes: PERSONA_TYPE_OPTIONS,
        personaTypeLabels: PERSONA_TYPE_LABELS,
      },
    });
  } catch (error) {
    next(error);
  }
}

function renderMailbox(req, res) {
  res.render('admin/simple-page', {
    title: 'Mailbox Admin | Stories by Shews',
    ...buildAdminBase(req, 'mailbox'),
    pageEyebrow: 'Applications',
    pageTitle: 'Mailbox',
    pageBody: 'Incoming admin mail and contact threads can be organized here later.',
  });
}

function renderFlags(req, res) {
  res.render('admin/simple-page', {
    title: 'Flags Admin | Stories by Shews',
    ...buildAdminBase(req, 'flags'),
    pageEyebrow: 'Applications',
    pageTitle: 'Flags',
    pageBody: 'Flagged items and moderation follow-up can live here when that workflow is added.',
  });
}

function renderSettings(req, res) {
  res.render('admin/simple-page', {
    title: 'Settings Admin | Stories by Shews',
    ...buildAdminBase(req, 'settings'),
    pageEyebrow: 'Preferences',
    pageTitle: 'Settings',
    pageBody: 'Admin preferences and environment-backed controls can live here.',
  });
}

function renderForms(req, res) {
  res.render('admin/simple-page', {
    title: 'Forms Admin | Stories by Shews',
    ...buildAdminBase(req, 'forms'),
    pageEyebrow: 'Publishing',
    pageTitle: 'Application Forms',
    pageBody: 'Create and manage founder-reviewed creative director applications and CD-specific audition intake here.',
  });
}

router.get('/login', (req, res) => {
  if (isAuthenticated(req)) {
    return res.redirect('/admin');
  }

  return res.render('admin/login', {
    title: 'Founder Console Login | Stories by Shews',
    error: req.query.error === 'invalid' ? 'That passcode did not match the admin access key.' : '',
    usingFallbackAccessKey: isUsingFallbackAccessKey(),
    fallbackAccessKey: getAdminAccessKey(),
  });
});

router.post('/login', (req, res) => {
  const submittedPasscode = normalizeText(req.body.passcode);

  if (!submittedPasscode) {
    return res.redirect('/admin/login?error=invalid');
  }

  const expected = Buffer.from(getAdminAccessKey(), 'utf8');
  const actual = Buffer.from(submittedPasscode, 'utf8');

  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return res.redirect('/admin/login?error=invalid');
  }

  setAuthCookie(res);
  return redirectWithoutQuery(res, '/admin');
});

router.post('/logout', requireAdmin, (req, res) => {
  clearAuthCookie(res);
  res.redirect('/admin/login');
});

router.get('/', requireAdmin, renderOverview);
router.get('/statistics', requireAdmin, renderStatistics);
router.get('/management', requireAdmin, renderManagement);
router.get('/stories', requireAdmin, renderStories);
router.get('/personas', requireAdmin, renderPersonas);
router.get('/forms', requireAdmin, renderForms);
router.get('/announcements', requireAdmin, renderAnnouncements);
router.get('/auditions', requireAdmin, renderAuditions);
router.get('/mailbox', requireAdmin, renderMailbox);
router.get('/flags', requireAdmin, renderFlags);
router.get('/settings', requireAdmin, renderSettings);

router.post('/announcements/save', requireAdmin, async (req, res, next) => {
  try {
    const id = normalizeText(req.body.id);
    const payload = {
      title: normalizeText(req.body.title),
      message: normalizeText(req.body.message),
      anchorText: normalizeText(req.body.anchorText) || 'See more',
      linkUrl: normalizeText(req.body.linkUrl),
      imageUrl: normalizeText(req.body.imageUrl),
      placement: ANNOUNCEMENT_PLACEMENTS.includes(req.body.placement)
        ? req.body.placement
        : 'global_banner',
      weight: normalizeNumber(req.body.weight, 0),
      status: STATUS_OPTIONS.includes(req.body.status) ? req.body.status : 'draft',
      startsAt: normalizeDate(req.body.startsAt),
      endsAt: normalizeDate(req.body.endsAt),
    };

    if (id) {
      await Announcement.findByIdAndUpdate(id, payload, { runValidators: true });
      return redirectToAdmin(res, {
        path: '/admin/announcements',
        editKey: 'editAnnouncement',
        edit: id,
        notice: 'Announcement updated.',
        tone: 'success',
      });
    }

    const created = await Announcement.create(payload);
    return redirectToAdmin(res, {
      path: '/admin/announcements',
      editKey: 'editAnnouncement',
      edit: String(created._id),
      notice: 'Announcement created.',
      tone: 'success',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/personas/save', requireAdmin, async (req, res, next) => {
  try {
    const id = normalizeText(req.body.id);
    const name = normalizeText(req.body.name);
    const stringId = slugify(req.body.stringId || name);
    const slug = slugify(req.body.slug || stringId || name);
    const payload = {
      stringId,
      slug,
      name,
      personaType: PERSONA_TYPE_OPTIONS.includes(req.body.personaType) ? req.body.personaType : 'figure',
      tagline: normalizeText(req.body.tagline),
      shortBio: normalizeText(req.body.shortBio),
      longBio: normalizeText(req.body.longBio),
      tags: splitCommaSeparated(req.body.tags),
      searchAliases: splitCommaSeparated(req.body.searchAliases).map((item) => item.toLowerCase()),
      images: buildPersonaImages(req.body),
      teaseAudio: {
        url: normalizeText(req.body.teaseAudioUrl),
        durationSeconds: normalizeNumber(req.body.teaseAudioDurationSeconds, 0),
      },
      status: STATUS_OPTIONS.includes(req.body.status) ? req.body.status : 'draft',
    };

    if (id) {
      await Persona.findByIdAndUpdate(id, payload, { runValidators: true });
      return redirectToAdmin(res, {
        path: '/admin/personas',
        editKey: 'editPersona',
        edit: id,
        notice: 'Profile updated.',
        tone: 'success',
      });
    }

    const created = await Persona.create(payload);
    return redirectToAdmin(res, {
      path: '/admin/personas',
      editKey: 'editPersona',
      edit: String(created._id),
      notice: 'Profile created.',
      tone: 'success',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/seasons/save', requireAdmin, async (req, res, next) => {
  try {
    const id = normalizeText(req.body.id);
    const title = normalizeText(req.body.title);
    const payload = {
      stringId: slugify(req.body.stringId || title),
      title,
      seasonNumber: normalizeNumber(req.body.seasonNumber, 1),
      description: normalizeText(req.body.description),
      status: STATUS_OPTIONS.includes(req.body.status) ? req.body.status : 'draft',
      startsAt: normalizeDate(req.body.startsAt),
      endsAt: normalizeDate(req.body.endsAt),
    };

    if (id) {
      await Season.findByIdAndUpdate(id, payload, { runValidators: true });
      return redirectToAdmin(res, {
        path: '/admin/stories',
        editKey: 'editSeason',
        edit: id,
        notice: 'Season updated.',
        tone: 'success',
      });
    }

    const created = await Season.create(payload);
    return redirectToAdmin(res, {
      path: '/admin/stories',
      editKey: 'editSeason',
      edit: String(created._id),
      notice: 'Season created.',
      tone: 'success',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/episodes/save', requireAdmin, async (req, res, next) => {
  try {
    const id = normalizeText(req.body.id);
    const title = normalizeText(req.body.title);
    const personaIds = Array.isArray(req.body.personaIds)
      ? req.body.personaIds
      : req.body.personaIds
        ? [req.body.personaIds]
        : [];
    const payload = {
      stringId: slugify(req.body.stringId || title),
      slug: slugify(req.body.slug || req.body.stringId || title),
      title,
      seasonId: normalizeText(req.body.seasonId),
      episodeNumber: normalizeNumber(req.body.episodeNumber, 1),
      personaIds,
      synopsis: normalizeText(req.body.synopsis),
      storyBody: normalizeText(req.body.storyBody),
      teaseAudio: {
        url: normalizeText(req.body.teaseAudioUrl),
        durationSeconds: normalizeNumber(req.body.teaseAudioDurationSeconds, 0),
      },
      coverImageUrl: normalizeText(req.body.coverImageUrl),
      status: STATUS_OPTIONS.includes(req.body.status) ? req.body.status : 'draft',
      publishedAt: normalizeDate(req.body.publishedAt),
    };

    if (id) {
      await Episode.findByIdAndUpdate(id, payload, { runValidators: true });
      return redirectToAdmin(res, {
        path: '/admin/stories',
        editKey: 'editEpisode',
        edit: id,
        notice: 'Episode updated.',
        tone: 'success',
      });
    }

    const created = await Episode.create(payload);
    return redirectToAdmin(res, {
      path: '/admin/stories',
      editKey: 'editEpisode',
      edit: String(created._id),
      notice: 'Episode created.',
      tone: 'success',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
