# ExpenseFlow - Smart Expense Tracker Frontend

Beautiful, modern React frontend for tracking expenses with AI-powered budget predictions.

## Features

✨ **Modern Glassmorphism Design** - Stunning UI with smooth animations
📊 **Interactive Charts** - Pie charts and bar graphs for expense visualization
🤖 **AI Predictions** - Machine learning powered spending forecasts
📱 **Fully Responsive** - Works perfectly on desktop, tablet, and mobile
⚡ **Quick Expense Entry** - Category selection with dropdown descriptions
🎯 **Budget Tracking** - Visual progress bars and alerts
💰 **Real-time Updates** - Live data synchronization with backend

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Lightning-fast build tool
- **Lucide React** - Beautiful icon library
- **Custom CSS** - Handcrafted animations and styles
- **Fetch API** - For backend communication

## Installation

### Prerequisites
- Node.js 16+ installed
- Backend server running on `http://localhost:5000`

### Setup Steps

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Quick Start

1. Make sure your backend is running on port 5000
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the dev server
4. Open http://localhost:3000 in your browser

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx          # Main dashboard with charts
│   │   ├── Dashboard.css
│   │   ├── ExpenseForm.jsx        # Add expense modal
│   │   ├── ExpenseForm.css
│   │   ├── ExpenseList.jsx        # List all expenses
│   │   ├── ExpenseList.css
│   │   ├── BudgetView.jsx         # Budget overview
│   │   ├── BudgetView.css
│   │   ├── PredictionView.jsx     # AI predictions
│   │   └── PredictionView.css
│   ├── App.jsx                    # Main app component
│   ├── App.css                    # Global styles
│   └── main.jsx                   # Entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Features Breakdown

### Dashboard
- Real-time spending overview
- Category breakdown pie chart
- Daily spending bar chart
- AI-powered recommendations
- Budget status indicators

### Expense Management
- Quick add with floating action button
- Category selection with visual icons
- Standard description dropdowns per category
- Date and time picker
- Notes field for additional details
- Easy delete functionality

### Budget Tracking
- Visual progress bars
- Exceeded budget alerts
- Period-based budgets (daily/weekly/monthly)
- Remaining amount calculation
- Color-coded status indicators

### AI Predictions
- Machine learning powered forecasts
- Confidence scores
- Trend analysis
- Monthly spending predictions
- One-click model retraining

## Design Philosophy

- **Glassmorphism** - Frosted glass effects with backdrop blur
- **Dark Theme** - Easy on the eyes with high contrast
- **Smooth Animations** - Delightful micro-interactions
- **Responsive** - Mobile-first approach
- **Accessible** - Semantic HTML and ARIA labels

## Configuration

### API Base URL
Update in `App.jsx`:
```javascript
const API_BASE = 'http://localhost:5000/api';
```

### Colors & Theme
Customize in `App.css` CSS variables:
```css
:root {
  --primary: #6366f1;
  --secondary: #8b5cf6;
  --accent: #ec4899;
  /* ...more colors */
}
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Fast Initial Load** - Vite optimized build
- **Lazy Loading** - Components load on demand
- **Optimized Re-renders** - React hooks optimization
- **Small Bundle Size** - ~200KB gzipped

## Troubleshooting

### Backend Connection Issues
- Ensure backend is running on port 5000
- Check CORS is enabled in backend
- Verify API endpoints in browser DevTools

### npm install fails
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 already in use
Change port in `vite.config.js`:
```javascript
server: {
  port: 3001
}
```

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Preview production build:
```bash
npm run preview
```

## Deployment

The frontend can be deployed to:
- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**
- **AWS S3 + CloudFront**
- Any static hosting service

Make sure to update the API_BASE URL to your production backend URL.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - Feel free to use for personal or commercial projects.

---

**Built with ❤️ using React, Vite, and modern web technologies**
