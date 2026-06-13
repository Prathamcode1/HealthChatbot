# Design Guidelines: Healthcare RAG Chatbot & Appointment System

## Design Approach
**Selected System:** Material Design 3 with healthcare-focused adaptations  
**Rationale:** Healthcare applications demand clarity, trust, and accessibility. Material Design provides robust patterns for data-dense interfaces while maintaining approachability through thoughtful hierarchy and clear interaction states.

## Core Design Principles
1. **Trust Through Clarity:** Medical information requires unambiguous presentation
2. **Guided Workflows:** Conversational UI should feel supportive, not confusing
3. **Information Hierarchy:** Critical health data must be immediately scannable
4. **Accessibility First:** WCAG 2.1 AA compliance is non-negotiable for healthcare

---

## Typography System

**Font Families:**
- Primary: Inter (headers, UI elements, chat messages)
- Secondary: Source Sans Pro (body text, medical content)

**Scale:**
- Hero/Display: 4xl to 6xl, font-weight-700
- Section Headers: 2xl to 3xl, font-weight-600
- Subsections: xl, font-weight-600
- Body Text: base to lg, font-weight-400
- Chat Messages: base, font-weight-400
- Labels/Meta: sm, font-weight-500
- Citations/Footnotes: xs, font-weight-400

---

## Layout & Spacing System

**Tailwind Spacing Primitives:** Use units of 3, 4, 6, 8, 12, 16  
- Tight spacing: p-3, gap-3 (chat bubbles, form fields)
- Standard spacing: p-4, gap-4 (cards, sections)
- Generous spacing: p-8, py-12, py-16 (page sections, hero)

**Grid Structure:**
- Desktop: max-w-7xl container with asymmetric splits (2/3 + 1/3 for chat + sidebar)
- Tablet: max-w-4xl, stack to single column where appropriate
- Mobile: full-width with px-4 padding

---

## Page Layouts

### Landing/Marketing Page
**Hero Section (80vh):**
- Split layout: Left 55% (headline + CTA), Right 45% (hero image)
- Headline: "AI-Powered Health Support & Expert Care Scheduling"
- Subheadline explaining RAG capabilities + appointment booking
- Two CTAs: "Ask a Health Question" (primary) + "Book Appointment" (secondary)
- Hero image: Professional healthcare setting showing doctor-patient consultation or modern medical facility

**Trust Indicators Section (py-16):**
- 3-column grid: "AI-Powered Answers with Citations" | "Expert Doctors Available" | "Secure & Private"
- Each with icon, bold stat, and supporting text

**Features Section (py-20):**
- 2-column alternating layout showcasing:
  1. Chat interface preview (screenshot/mockup) + feature description
  2. Appointment calendar interface + booking flow description
- Use max-w-5xl for content width

**How It Works Section (py-16):**
- Vertical timeline/stepper: Ask → AI Analyzes → Get Answers with Citations → Book if Needed
- Each step with number badge, headline, description

**CTA Section (py-20):**
- Centered layout with compelling headline
- Dual CTAs repeated from hero
- Trust badges: "HIPAA Compliant" | "Encrypted" | "Verified Doctors"

**Footer:**
- 3-column layout: About/Legal links | Contact info | Quick Links
- Newsletter signup with context: "Health tips and updates"

### Chat Application Interface

**Layout Structure:**
- Fixed header (h-16): Logo, "Health Chat Assistant" title, appointment button, user menu
- Main area: Sidebar (w-80, hidden on mobile) + Chat area (flex-1) + Info panel (w-96, collapsible)
- Sidebar: Conversation history, new chat button, filters
- Chat area: Messages container + input footer
- Info panel: Patient context, cited sources, suggested actions

**Message Bubbles:**
- User messages: Right-aligned, rounded-2xl, px-4 py-3
- AI messages: Left-aligned, rounded-2xl, px-4 py-3, max-w-2xl
- System messages (slot-filling prompts): Centered, subtle styling
- Citation cards: Inline within AI messages, rounded-lg, p-3, with source indicator

**Input Area (fixed bottom):**
- Multi-line textarea with rounded-xl border, p-4
- Send button (icon only) positioned bottom-right of textarea
- Attachment/options icons on left
- Character count and typing indicator

### Appointment Booking Interface

**Two Entry Points:**
1. Dedicated page accessed from navigation
2. Inline booking flow triggered from chat (modal overlay)

**Booking Form Layout:**
- Step indicator at top (1. Patient Info → 2. Select Doctor → 3. Choose Time → 4. Confirm)
- Single-column form with generous spacing (gap-6)
- Each section grouped with rounded-xl cards, p-6
- Doctor cards: Grid layout (2-3 columns), includes photo, specialty, availability badge
- Calendar component: Week view with timezone selector prominent
- Confirmation screen: Summary card + ICS download button + calendar add options

**Calendar Component:**
- Week grid with time slots (30min intervals)
- Available slots clearly distinguished from booked
- Timezone selector dropdown always visible
- Mobile: Stack to day view

---

## Component Library

**Buttons:**
- Primary: Large (px-6 py-3), rounded-lg, font-weight-600
- Secondary: Large (px-6 py-3), rounded-lg, border-2, font-weight-600
- Icon buttons: Square (w-10 h-10), rounded-full
- Floating action: Bottom-right corner (chat icon), w-14 h-14, rounded-full, shadow-lg

**Cards:**
- Standard: rounded-xl, p-6, border or subtle shadow
- Elevated: rounded-xl, p-6, shadow-md for important content
- Citation cards: rounded-lg, p-3, border-l-4 for emphasis

**Forms:**
- Input fields: rounded-lg, px-4 py-3, border, text-base
- Labels: text-sm, font-weight-500, mb-2
- Helper text: text-xs below inputs
- Validation: Real-time with inline error messages
- Required fields: Asterisk in label

**Navigation:**
- Top nav: Sticky, backdrop-blur, border-b
- Desktop: Horizontal links with hover underline
- Mobile: Hamburger menu with slide-out drawer

**Modals/Overlays:**
- Backdrop: Semi-transparent overlay
- Content: Centered, max-w-2xl, rounded-2xl, p-8
- Close button: Top-right corner, rounded-full

**Loading States:**
- Skeleton screens for chat messages and cards
- Spinner for page loads (centered, subtle animation)
- Progressive disclosure for long medical content

---

## Images

**Hero Image:**
- Large, professional photo showing modern healthcare environment
- Suggested: Friendly doctor with tablet/technology or clean medical facility interior
- Treatment: Slight gradient overlay for text readability
- Placement: Right 45% of hero section on desktop, full-width background on mobile

**Feature Section Images:**
- Chat interface mockup/screenshot showing conversation flow
- Calendar/booking interface preview
- Both should be actual product screenshots with realistic data

**Doctor Profile Photos:**
- Consistent aspect ratio (1:1, rounded-full or rounded-lg)
- Professional headshots with neutral backgrounds

**Trust/Credibility:**
- Icons for features (use Heroicons via CDN)
- Certification badges in footer

---

## Accessibility Requirements

- All interactive elements: min-height of 44px (touch targets)
- Focus states: Visible 2px outline on all focusable elements
- Form labels: Always visible, not placeholder-only
- Error states: Icon + text + ARIA announcements
- Skip navigation link for keyboard users
- ARIA labels on icon-only buttons
- Semantic HTML: proper heading hierarchy (h1 → h2 → h3)

**Icon Library:** Heroicons via CDN (outline style for navigation, solid for filled states)