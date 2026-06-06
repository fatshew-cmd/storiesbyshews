# MVP Roadmap: storiesbyshews

**Goal:** To build a controlled storytelling platform with founder-owned fiction, token-ready consumption, and a founder-vetted creative director network.

---

## 1. MVP Scope

### Phase 1: Consumer Foundation
* **Landing Page:** High-impact entrance with a mandatory age gate.
* **Announcement Banner:** Site-wide promo content driven by MongoDB.
* **Featured Story Cards:** Homepage support for founder-published story discovery.
* **Featured Podcast / Audio Drops:** Homepage support for audio-first content.
* **Creative Director Highlights:** Homepage support for public CD discovery.

### Phase 2: Founder Publishing
* **Basic Founder Console:** Protected admin entry for controlled publishing.
* **Founder Capabilities:**
  * Create and update fictional figures
  * Create and update seasons and episodes
  * Manage announcements
  * Control what goes live publicly
* **Publishing Workflow:** Content supports `draft`, `published`, and `archived` for the current build, with richer approval states to come.

### Phase 3: Creative Director Network
* **Creative Director Profile Direction:** Public profile pages for approved CDs.
* **CD Application Intake:** A starter founder-reviewed vetting flow for prospective CDs.
* **Portfolio Surface:** Support for photo, video, and voice portfolio examples.

### Phase 4: Being Auditions
* **CD-Specific Audition Entry Point:** Users should apply through a selected CD, not through a generic platform-wide form.
* **Custom Questions Per CD:** Intake questions belong to the CD profile.
* **Relationship-Based Approval:** A being is approved under a specific CD relationship, not globally.

## 2. Technical Architecture

### Database (Current Build vs Target Direction)
* **Current Build:**
  * `admins`
  * `users`
  * `personas`
  * `seasons`
  * `episodes`
  * `announcements`
* **Target Direction:**
  * split legacy `personas` into founder-owned figures, CD profiles, beings, and relationship/application records
  * add token ledger / purchase tracking
  * add CD application and CD-specific audition entities

### Backend (Node.js / Express)
* **Current/Target Surfaces:**
  * `GET /` for the landing page and age gate
  * `GET /creative-directors` for CD discovery
  * `GET /admin` for founder console access
  * future routes for stories, podcasts, CD applications, and CD-specific auditions

### Frontend (EJS / Tailwind)
* **Templates:** `index.ejs`, creative-director-facing public templates, founder admin templates
* **Styling Direction:** Luxury editorial storytelling, premium audio cues, and curated portfolio presentation

## 3. Out of Scope for This MVP
* Open social posting by the public
* Self-serve creator publishing without founder approval
* Complex rights / contract management
* Payments beyond the initial token purchase direction
* Advanced recommendation systems

## 4. Immediate Sprint Checklist
- [x] Review the repo for old persona-first direction
- [x] Update core product docs to the founder / CD / being model
- [x] Update visible UI language to the founder / CD / being model
- [ ] Split the legacy persona data model into the new architecture
- [ ] Add creative director application entities and workflows
- [ ] Add CD-specific audition entities and workflows
- [ ] Add token purchase and token spend tracking
- [ ] Add public CD profile routes and content loading
