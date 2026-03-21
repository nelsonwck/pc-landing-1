# Prime Collective Landing Page

A dark luxury landing page for Prime Collective, a private wine society. Built with Vite, SCSS, and vanilla JavaScript.

## Features

- 🎨 Dark luxury aesthetic with gold accents
- ✨ Cinematic scroll animations using Intersection Observer
- 🎬 Parallax scrolling effects
- 📝 Custom form with validation
- 📧 Email notifications via Resend API
- 📊 Google Sheets integration for lead tracking
- 📈 Google Analytics 4 with conversion tracking
- 📱 Fully responsive (mobile, tablet, desktop)
- ♿ WCAG 2.1 Level AA accessibility

## Tech Stack

- **Build Tool:** Vite 5.x
- **Styling:** SCSS with custom design system
- **JavaScript:** Vanilla ES6+ (no frameworks)
- **Email:** Resend API
- **Analytics:** Google Analytics 4
- **Deployment:** Static hosting (Netlify, Vercel, etc.)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Navigate to the website directory:
   ```bash
   cd website
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
5. Configure environment variables in `.env`:
   ```
   VITE_RESEND_API_KEY=your_resend_api_key
   VITE_EMAIL_RECIPIENT=your@email.com
   VITE_GOOGLE_SHEETS_URL=your_apps_script_url
   VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

### Development

Start the dev server:
```bash
npm run dev
```

Visit http://localhost:3000

### Build for Production

Create production build:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── index.html                 # Main HTML file
├── styles/
│   ├── main.scss             # Main stylesheet entry
│   ├── _variables.scss       # Design system variables
│   ├── _mixins.scss          # Utility mixins
│   ├── _typography.scss      # Font faces and type scale
│   ├── _animations.scss      # Keyframes and animation classes
│   ├── _sections.scss        # Section-specific styles
│   └── _responsive.scss      # Responsive overrides
├── scripts/
│   ├── main.js               # Main JS entry point
│   ├── animations.js         # Scroll animations, parallax
│   ├── form-handler.js       # Form validation and submission
│   └── analytics.js          # Google Analytics 4
└── assets/
    ├── fonts/                # Custom fonts (Agatho, Orpheus Pro)
    ├── images/               # Placeholder images
    └── logo/                 # PC logos
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_RESEND_API_KEY` | Resend API key for email sending | Yes |
| `VITE_EMAIL_RECIPIENT` | Email address to receive form submissions | Yes |
| `VITE_GOOGLE_SHEETS_URL` | Google Apps Script web app URL | Yes |
| `VITE_GA4_MEASUREMENT_ID` | Google Analytics 4 measurement ID | Optional |

## Third-Party Setup

### Resend API

1. Sign up at https://resend.com
2. Verify your domain (or use resend.dev for testing)
3. Get API key from dashboard
4. Add to `.env` as `VITE_RESEND_API_KEY`

### Google Sheets

1. Create a Google Sheet with columns: Timestamp, Name, Email, Phone, Company, Interest, Consent
2. Create a Google Apps Script (Extensions → Apps Script)
3. Deploy as web app (Execute as: Me, Access: Anyone)
4. Copy web app URL to `.env` as `VITE_GOOGLE_SHEETS_URL`

### Google Analytics 4

1. Create GA4 property at https://analytics.google.com
2. Get Measurement ID (format: G-XXXXXXXXXX)
3. Add to `.env` as `VITE_GA4_MEASUREMENT_ID`
4. Configure conversion events in GA4 dashboard:
   - Event: `form_submission`
   - Mark as conversion

## Deployment

### Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Add environment variables in Netlify dashboard

### Vercel

1. Build command: `npm run build`
2. Output directory: `dist`
3. Add environment variables in Vercel dashboard

### Manual

1. Run `npm run build`
2. Upload `dist/` folder to your hosting provider
3. Ensure environment variables are set

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- iOS Safari (latest 2 versions)
- Chrome Android (latest 2 versions)

## Performance

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Total Bundle Size: ~150KB (gzipped)

## License

© 2026 Prime Collective. All rights reserved.
