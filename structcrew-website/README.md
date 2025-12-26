# StructCrew Website

A modern, responsive landing page for StructCrew - AI-powered lead generation platform.

## Features

- ✅ Modern, professional design
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Smooth scroll navigation
- ✅ Animated sections on scroll
- ✅ Contact form with validation
- ✅ Services showcase
- ✅ Pricing plans
- ✅ Call-to-action sections
- ✅ Fast loading performance

## Local Development

### Option 1: Python (Simplest)
```bash
cd structcrew-website
python3 -m http.server 8000
```

Visit: http://localhost:8000

### Option 2: Node.js
```bash
cd structcrew-website
npx http-server -p 8000
```

Visit: http://localhost:8000

### Option 3: VS Code Live Server
1. Install "Live Server" extension
2. Right-click on index.html
3. Select "Open with Live Server"

## Deployment

### Option 1: Netlify (Free, Recommended)

1. Go to https://netlify.com
2. Sign up/login
3. Drag and drop the `structcrew-website` folder
4. Your site will be live in seconds!

### Option 2: Vercel (Free)

```bash
npm install -g vercel
cd structcrew-website
vercel
```

### Option 3: GitHub Pages (Free)

1. Push this repository to GitHub
2. Go to repository Settings > Pages
3. Select source branch (main)
4. Choose folder: `/structcrew-website`
5. Your site will be live at: `https://yourusername.github.io/repository-name`

### Option 4: Surge.sh (Free)

```bash
npm install -g surge
cd structcrew-website
surge
```

## File Structure

```
structcrew-website/
├── index.html          # Main HTML file
├── css/
│   └── style.css        # Styles and responsive design
├── js/
│   └── main.js          # Interactive features
└── images/              # Add your images here
```

## Customization

### Update Contact Information
Edit `index.html` in the contact section:
```html
<div class="contact-item">
    <div class="contact-icon">📧</div>
    <div>
        <h4>Email</h4>
        <p>hello@structcrew.com</p>
    </div>
</div>
```

### Change Branding Colors
Edit `css/style.css`:
```css
:root {
    --primary-color: #2563eb;      /* Change this */
    --primary-dark: #1e40af;        /* Change this */
    --secondary-color: #0ea5e9;     /* Change this */
}
```

### Update Statistics
Edit `index.html` in the hero section:
```html
<div class="stat">
    <span class="stat-number">10K+</span>
    <span class="stat-label">Leads Generated</span>
</div>
```

### Modify Services
Edit `index.html` services section:
```html
<div class="service-card">
    <div class="service-icon">🔍</div>
    <h3>Your Service</h3>
    <p>Description here</p>
</div>
```

### Update Pricing Plans
Edit `index.html` pricing section:
```html
<div class="pricing-card">
    <div class="pricing-header">
        <h3>Your Plan Name</h3>
        <div class="price">$99<span>/month</span></div>
    </div>
</div>
```

## Features Breakdown

### Header
- Fixed navigation bar
- Smooth scroll to sections
- Responsive mobile menu (can be enhanced)

### Hero Section
- Compelling headline
- Call-to-action buttons
- Key statistics display
- Gradient text effects

### Services Section
- 6 service cards with icons
- Hover animations
- Responsive grid layout

### How It Works
- 3-step process
- Visual step indicators
- Clear descriptions

### Pricing Section
- 3 pricing tiers
- Featured plan highlight
- Clean feature lists

### Contact Section
- Contact form with validation
- Contact information display
- Responsive layout

### Footer
- Quick links
- Social media links
- Legal links
- Professional design

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- ⚡ Fast loading (<2 seconds)
- 📱 Mobile-optimized
- 🎨 Modern CSS (Grid, Flexbox)
- 🔒 No dependencies required

## Next Steps

1. ✅ Customize content (text, images, contact info)
2. ✅ Update branding (colors, logo)
3. ✅ Add real contact form backend
4. ✅ Set up analytics (Google Analytics)
5. ✅ Add favicon
6. ✅ Optimize images
7. ✅ Deploy to your preferred platform

## Support

For issues or questions, refer to the main project README or contact the development team.

---

**Made with ❤️ for StructCrew**