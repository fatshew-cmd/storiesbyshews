# Product Requirements Document (PRD): storiesbyshews

**Project Name:** storiesbyshews  
**Version:** 2.0  
**Status:** Working Draft  
**Tech Stack:** Node.js, Express, MongoDB, EJS, Tailwind CSS

---

## 1. Executive Summary
**Vision:** To build a founder-owned storytelling platform where audiences unlock premium fiction, audio stories, and podcast episodes while discovering a curated network of creative directors and represented talent.

**Core Value Proposition:** Unlike open social platforms, *storiesbyshews* is a controlled publishing ecosystem. The founder owns the fictional universe, publishes the official figures and story canon, vets creative directors before they go live, and approves represented beings through CD-specific audition pathways.

## 2. Platform Vocabulary
* **Figure:** A fictional character owned and published by the founder.
* **Being:** A real person who has been approved through a creative-director-specific relationship.
* **Creative Director (CD):** A vetted professional collaborator who can showcase portfolio work, define audition requirements, and sponsor beings.
* **Consumer:** A user who buys tokens and spends them on gated stories, audio stories, or podcast episodes.
* **Audition:** A CD-specific application through which a real person seeks representation or approval under that CD.
* **CD Application:** The platform vetting flow used to approve photographers, videographers, voice-focused directors, and similar collaborators before they receive a public profile.

## 3. Target Audience
* **Consumers:** Listeners and readers who buy tokens to access stories, audio stories, and podcast episodes.
* **Creative Directors:** Vetted collaborators in photography, video, voice, and adjacent creative disciplines.
* **Talent / Beings:** Real people who enter the platform through CD-defined audition pathways.
* **Founder / Platform Owner:** The sole authority who publishes figures and controls the overall platform.

## 4. Functional Requirements

### 4.1 Consumer Experience
* **Token-Gated Consumption:** Consumers can purchase tokens and spend them to unlock premium stories, audio stories, and podcast episodes.
* **Discovery Surface:** The landing experience should highlight:
  * podcast episodes
  * story cards
  * creative director profile pages
* **Content Detail Pages:** Users should be able to view content metadata, preview teaser material, and understand token costs before unlocking.

### 4.2 Founder-Owned Fiction Layer
* **Figures Are Founder-Published:** Only the founder can create and publish figures.
* **Official Story Canon:** Stories involving figures belong to the founder-managed universe.
* **Audio Expansion:** The same publishing layer should support narrated stories and podcast-style releases.

### 4.3 Creative Director Network
* **Creative Director Profiles:** Each approved CD receives a public page with:
  * bio and specialties
  * portfolio work such as photos, videos, or voice samples
  * audition rules, requirements, conditions, and custom questions
* **Founder Approval Required:** No CD profile goes live without founder approval.
* **Specialties:** The model should support at least `photo`, `video`, and `voice`, with room for future expansion.

### 4.4 Being / Audition Workflow
* **No Open Global Audition Flow:** A being does not apply generically to the platform.
* **CD-Specific Entry Point:** A being applies through a specific CD page.
* **Custom Questions Per CD:** Each CD can define their own audition questions, conditions, and intake expectations.
* **Per-CD Approval:** A being is approved only in relation to a specific CD, not globally across the platform.
* **Multi-CD Relationships:** A being may be associated with multiple CDs at the same time.

### 4.5 Creative Director Vetting
* **Public Application Page:** Prospective CDs can apply through a dedicated platform flow.
* **Application Inputs May Include:**
  * legal name and contact info
  * creative specialties
  * portfolio links
  * professional references
  * social presence
  * notes on casting, production, or voice direction experience
* **Founder Review:** The founder reviews and approves or rejects the application before public activation.

### 4.6 Admin Domain / Platform Operations
* **Protected Founder Console:** A dedicated admin route or domain is required for controlled publishing and review workflows.
* **Core Admin Capabilities:**
  * publish and manage figures
  * publish and manage stories, audio stories, and podcast episodes
  * vet and approve creative directors
  * review CD-specific auditions
  * manage announcements
  * manage token-related content configuration later

## 5. Information Architecture
* **Homepage:** Landing page with age gate, featured story cards, featured podcast drops, creative directors, and announcements.
* **Creative Director Routes:** Target direction is a public route such as `/creative-directors/:slug`
* **Story Routes:** A public story route should exist for founder-published fictional releases.
* **Podcast Routes:** A public episode route should exist for audio and podcast releases.
* **Applications:** The platform should support separate entry points for:
  * creative director applications
  * CD-specific being auditions

## 6. Data Model Direction
* **Core Collections (target direction):**
  * `admins`
  * `users`
  * `figures`
  * `creative_director_profiles`
  * `creative_director_applications`
  * `being_profiles`
  * `being_representations`
  * `audition_applications`
  * `stories`
  * `podcast_episodes`
  * `token_transactions`
  * `announcements`
* **Status Model:** Publishable and reviewable collections should support draft/review/approved/published-style states as appropriate.
* **Ownership Model:** Founder-owned universe content must remain distinct from CD-managed public profiles and portfolios.

## 7. Non-Functional Requirements
* **Performance:** Optimize media-heavy pages for editorial visuals and audio playback.
* **Age Verification:** A mandatory age gate remains required.
* **Responsiveness:** Mobile-first design across phones, tablets, and desktops.
* **Security:** Secure handling of application data, media links, and personally identifying information.
* **Scalability:** The platform should support growth in founder content, CD portfolios, beings, and tokenized consumption without another conceptual rewrite.

## 8. User Roles
* **Visitor:** Browses the platform without purchasing or applying.
* **Consumer:** Standard user who buys and spends tokens on premium content.
* **Creative Director:** Founder-approved collaborator with a public profile and audition rules.
* **Founder Admin:** Primary publishing authority and approval owner of the platform.
* **Moderator / Ops Support:** Optional future role for operational follow-up.
