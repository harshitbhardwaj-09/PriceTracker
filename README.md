# priceTracker v2 🚀

**priceTracker** is a cutting-edge full-stack price tracking application built with modern web techn1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Run the development server**:

   ```bash
   npm run dev
   ```

4. **Open your browser**: This enhanced version provides comprehensive price monitoring, intelligent predictions, and seamless user experience across all devices. The platform specializes in Amazon price tracking with advanced bot detection avoidance and real-time notifications.

## ✨ Key Features

### 🎯 Smart Price Tracking

- **Amazon Integration**: Advanced web scraping with ScraperAPI for reliable data extraction
- **Intelligent URL Cleaning**: Automatically removes tracking parameters and extracts product IDs
- **Indian Currency Support**: Handles complex number formatting (₹2,999, ₹1,29,999)
- **Anti-Bot Detection**: ScraperAPI handles CAPTCHA and bot detection automatically

### 🤖 AI-Powered Insights

- **Price Prediction Models**: Machine learning algorithms predict future price trends
- **Smart Recommendations**: AI-driven buying recommendations (Excellent, Good, Moderate)
- **Price Drop Analysis**: Calculate probability of future price drops
- **Historical Trends**: Advanced price history analysis with insights

### 🔔 Real-Time Notifications

- **Instant Alerts**: Sonner toast notifications for all user interactions
- **Email Notifications**: Automated price drop alerts via Nodemailer
- **Smart Timing**: Notifications only when significant price changes occur
- **Cross-Platform**: Works seamlessly on desktop and mobile devices

### 🛡️ Advanced Security & Performance

- **Rate Limiting**: Redis-powered request throttling to prevent abuse
- **Cron Jobs**: Automated price updates using Next.js API routes
- **Error Handling**: Comprehensive error management with user-friendly messages
- **Platform Detection**: Smart URL analysis for supported platforms

### 📱 Modern User Experience

- **Responsive Design**: Optimized for all screen sizes with Tailwind CSS
- **Interactive UI**: Smooth animations with Framer Motion
- **Loading States**: Beautiful loading indicators for better UX
- **Search Functionality**: Dual support for product URLs and name-based search

## 🛠️ Tech Stack

### Frontend

- **Next.js 14**: App Router with Server Components and Client Components
- **TypeScript**: Full type safety and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Framer Motion**: Smooth animations and micro-interactions
- **Sonner**: Beautiful toast notifications
- **React Hook Form**: Efficient form handling

### Backend & APIs

- **Next.js Server Actions**: Type-safe server-side operations
- **Node.js**: Runtime environment for server-side logic
- **RESTful APIs**: Clean API design with proper error handling
- **Cron Jobs**: Automated background tasks for price updates

### Database & Storage

- **MongoDB**: NoSQL database for flexible data storage
- **Mongoose**: Object modeling for Node.js and MongoDB
- **Redis**: High-performance caching and rate limiting

### Web Scraping & External Services

- **ScraperAPI**: Professional scraping API with automatic CAPTCHA solving and proxy rotation
- **Custom Scrapers**: Intelligent product data extraction
- **PriceHistoryApp**: Integration for enhanced price analytics
- **SerpAPI**: Google Shopping results for product search

### DevOps & Tools

- **Vercel**: Deployment and hosting platform
- **Git**: Version control and collaboration
- **ESLint**: Code linting and quality assurance
- **Prettier**: Code formatting for consistency

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- MongoDB database
- Redis instance (Upstash)
- ScraperAPI account and API key
- SerpAPI account and API key

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Redis (Upstash)
UPSTASH_REDIS_URL=your_upstash_redis_url
UPSTASH_REDIS_TOKEN=your_upstash_redis_token

# ScraperAPI (for Amazon scraping)
# Get your key from https://www.scraperapi.com/
SCRAPER_API_KEY=your_scraperapi_key_here

# Email Service (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# SerpAPI (for Google Shopping results)
# Get your key from https://serpapi.com/manage-api-key
API_KEY=your_serpapi_key_here
SERPAPI_API_KEY=your_serpapi_key_here
```

### Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### For Users

1. **Product Tracking**: Paste Amazon product URLs or search by product name
2. **Smart Notifications**: Get alerts when prices drop significantly
3. **Price History**: View detailed price trends and predictions
4. **Buying Recommendations**: Receive AI-powered purchase timing advice

### For Developers

1. **API Endpoints**: Use `/api/cron/route.ts` for automated price updates
2. **Custom Scrapers**: Extend scraping functionality in `/lib/scrape/`
3. **Database Models**: Modify schemas in `/models/` directory
4. **UI Components**: Customize components in `/app/components/`

## 🏗️ Project Structure

```
priceTracker-v2/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── components/         # Reusable UI components
│   │   ├── products/[id]/      # Product detail pages
│   │   ├── shopping/[q]/       # Search results pages
│   │   └── api/               # API routes and cron jobs
│   ├── lib/                   # Utility functions and actions
│   │   ├── actions/           # Server actions
│   │   ├── scrape/           # Web scraping logic
│   │   └── nodemailer/       # Email service
│   ├── models/               # Database schemas
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
└── README.md                # Project documentation
```

## 🎯 Key Features Implemented

### Enhanced Amazon Scraping

- **URL Cleaning**: Removes complex tracking parameters
- **Price Extraction**: Handles Indian number formatting
- **Product Detection**: Smart product ID extraction
- **Error Handling**: Comprehensive fallback mechanisms

### Smart UI/UX

- **Loading States**: Sonner toasts for all interactions
- **Mobile Responsive**: Optimized for all screen sizes
- **Platform Detection**: Automatic URL validation
- **Search Flexibility**: Support for both URLs and product names

### Advanced Price Analytics

- **Historical Data**: Integration with PriceHistoryApp
- **Trend Analysis**: Price movement predictions
- **Smart Alerts**: Only notify for significant changes
- **Buying Recommendations**: AI-powered purchase timing

## 🏛️ Architecture Overview

### System Design

- **Next.js App Router**: Modern file-based routing with server components
- **Server Actions**: Type-safe server-side operations without API routes
- **MongoDB Integration**: Efficient data storage with Mongoose ODM
- **Redis Caching**: Fast data retrieval and rate limiting
- **Proxy Integration**: BrightData for reliable web scraping

### Data Flow

1. **User Input**: Product URL or search query
2. **Validation**: Platform detection and URL cleaning
3. **Scraping**: Secure data extraction with proxy rotation
4. **Processing**: Price analysis and trend calculation
5. **Storage**: MongoDB for persistence, Redis for caching
6. **Notifications**: Real-time alerts via email and toast

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup

1. **Create a feature branch**: `git checkout -b feature/amazing-feature`
2. **Make your changes** and test thoroughly
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`

### Contribution Guidelines

- Follow the existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure mobile responsiveness for UI changes
- Test across different browsers and devices

### Areas for Contribution

- 🎨 **UI/UX Improvements**: Enhance user interface and experience
- 🔧 **Performance Optimization**: Improve loading times and efficiency
- 🌐 **Platform Support**: Add support for more e-commerce platforms
- 🤖 **ML Models**: Enhance price prediction algorithms
- 📱 **Mobile Features**: Add mobile-specific functionality
- 🔒 **Security**: Strengthen authentication and data protection

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support & Contact

- **Developer**: Harshit

## 🏆 Acknowledgments

- **BrightData**: For reliable proxy services
- **PriceHistoryApp**: For enhanced price analytics
- **Vercel**: For seamless deployment and hosting
- **MongoDB**: For flexible and scalable database solutions

---

Made with ❤️ by Harshit
