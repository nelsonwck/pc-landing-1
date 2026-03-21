# Deployment Guide

## Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Resend API key obtained and tested
- [ ] Google Sheets Apps Script deployed
- [ ] Google Analytics 4 property created
- [ ] Production build tested locally (`npm run build && npm run preview`)
- [ ] All tests passing
- [ ] README.md updated

## Netlify Deployment

1. Connect repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: `website`
3. Add environment variables in Netlify dashboard:
   - `VITE_RESEND_API_KEY`
   - `VITE_EMAIL_RECIPIENT`
   - `VITE_GOOGLE_SHEETS_URL`
   - `VITE_GA4_MEASUREMENT_ID`
4. Deploy
5. Test live site

## Vercel Deployment

1. Import project to Vercel
2. Configure build settings:
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
   - Root directory: `website`
3. Add environment variables in Vercel dashboard
4. Deploy
5. Test live site

## Post-Deployment

- [ ] Verify form submission works end-to-end
- [ ] Check Resend dashboard for sent emails
- [ ] Check Google Sheet for logged data
- [ ] Verify GA4 Real-Time tracking
- [ ] Test on multiple devices (desktop, mobile, tablet)
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Configure custom domain (if applicable)
- [ ] Set up SSL/HTTPS
- [ ] Submit sitemap to Google Search Console

## Monitoring

- Check Resend dashboard for email delivery status
- Monitor Google Analytics 4 for traffic and conversions
- Check Google Sheets for lead quality

## Troubleshooting

**Form not submitting:**
- Check browser console for errors
- Verify environment variables are set correctly
- Check Resend API key permissions
- Verify Google Sheets Apps Script URL

**Analytics not tracking:**
- Check GA4 Measurement ID is correct
- Verify gtag script is loading (Network tab)
- Check GA4 Real-Time view

**Images not loading:**
- Verify image paths are correct (relative to src/)
- Check dist/ folder after build
