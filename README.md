# Afya Intelligence - Symptom Journal

## Project Overview

Afya Intelligence is a comprehensive health tracking application designed to empower individuals and communities in achieving United Nations Sustainable Development Goal 3 (Good Health and Well-Being). The platform combines symptom tracking, AI-driven health insights, and community data aggregation to support both personal health management and global health research.

## Features

### 🔐 **Authentication & Security**
- Secure user registration and authentication powered by Supabase
- Row Level Security (RLS) ensures data privacy and user isolation
- JWT-based session management with automatic token refresh

### 📊 **Symptom Tracking & Management**
- Comprehensive symptom logging with severity levels (1-5 scale)
- Timestamp-based tracking with offline support
- Personal symptom history with pattern analysis
- Data visualization with progress indicators

### 🤖 **AI Health Insights**
- Powered by Hugging Face models for intelligent pattern recognition
- Personalized health recommendations based on symptom patterns
- Severity-based alerts and warnings
- Educational insights for health awareness
- Advanced tier users get priority AI processing

### 💰 **Tiered Subscription System**
- **Community Advocate (Free):** Basic symptoms tracking, limited AI insights
- **Health Champion ($1.10/month):** Advanced AI, unlimited history, data export
- **Global Advocate ($3.00/month):** All features, family sharing, expert consultations

### 📱 **Mobile-First Progressive Web App (PWA)**
- Installable on mobile devices for offline access
- Service worker for background sync and offline functionality
- Push notifications for health reminders
- Responsive design optimized for all screen sizes

### 🌙 **User Experience**
- Light/Dark mode toggle for accessibility
- Intuitive dashboard with health metrics
- Real-time offline indicator
- Export functionality for data portability

### 💳 **M-Pesa STK Push Integration**
- Seamless mobile payment integration for Kenyan users
- Real-time payment confirmation via callbacks
- Automatic subscription activation upon successful payment
- Support for both new registrations and tier upgrades

## System Architecture

### Frontend Stack
- **Framework:** React 18 with TypeScript for type safety
- **Build Tool:** Vite for fast development and optimized production builds
- **Styling:** Tailwind CSS with Shadcn UI component library
- **Routing:** React Router v6 with protected route guards
- **State Management:**
  - React Query for server state management and caching
  - Context API for global authentication state
  - Local state management with hooks

### Backend & Infrastructure
- **Database:** PostgreSQL hosted on Supabase
- **Authentication:** Supabase Auth with social login support
- **Storage:** Supabase Storage for user-generated content
- **Real-time Features:** Supabase Realtime for live updates

### Payment Processing
- **Primary Provider:** M-Pesa via Intasend integration
- **STK Push Features:**
  - Mobile-optimized payment experience
  - Callback-based confirmation system
  - Real-time payment status updates
  - Automatic subscription management

### AI & Machine Learning
- **Provider:** Hugging Face Inference API
- **Models:** DialoGPT for conversational health insights
- **Fallback Strategy:** Intelligent rule-based analysis when API unavailable
- **Tier-based Processing:** Enhanced AI processing for premium users

## Design Principles

The application follows modern web development best practices with emphasis on:

- **Accessibility:** ARIA labels, keyboard navigation, screen reader support
- **Performance:** Lazy loading, code splitting, and efficient re-renders
- **Security:** Environment variable management, secure API integration
- **User Experience:** Intuitive workflows, loading states, error handling
- **Mobile-First:** Responsive design with PWA capabilities

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="wulixeqhldugffifvpzp"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bGl4ZXFobGR1Z2ZmaWZ2cHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTk4NDIsImV4cCI6MjA3MjIzNTg0Mn0.6AY6PngVLmNFV-8d6MjlrNHKoxBZbJ6h51T2TxZgoYI"
VITE_SUPABASE_URL="https://wulixeqhldugffifvpzp.supabase.co"

# AI Integration
VITE_HUGGING_FACE_API_KEY="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"

# Payment Processing (M-Pesa via Intasend)
VITE_INTASEND_PUBLISHABLE_KEY="ISPubKey_test_ebbf5187-cad7-4cb6-92aa-03a2b738ce79"
VITE_INTASEND_SECRET_KEY="ISSecretKey_test_e6271f8d-835d-496f-96d2-171788dfc330"
VITE_INTASEND_BASE_URL=https://sandbox.intasend.com/api/v1
```

## Local Development Setup

### Prerequisites
- Node.js 18+ and npm
- Git
- Supabase CLI (optional, for local development)

### Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/PLP-Academy/Afya-Intelligence.git
cd Afya-Intelligence
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env  # Configure your API keys
```

4. **Start the development server:**
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run preview      # Preview production build

# Quality Assurance
npm run lint         # Run ESLint
npm run test         # Run Vitest
npm run test:ui      # Run tests with UI

# Utilities
npm run type-check   # TypeScript type checking
```

## Testing the Application

### Development Environment
- Use the provided `.env` file with test API keys
- M-Pesa integration uses sandbox environment
- Test payment flows with phone number `+254712345678`

### Key Test Scenarios
1. **User Registration & Payment:**
   - Register with M-Pesa phone number
   - Complete STK Push payment flow
   - Verify subscription activation

2. **Symptom Logging:**
   - Add symptoms with different severity levels
   - Test offline functionality
   - Verify AI insights generation

3. **Tier Upgrades:**
   - Upgrade from Community Advocate to Health Champion
   - Test payment processing and tier activation

## Deployment

### Build for Production
```bash
npm run build
```

### Deployment Options
1. **Lovable Platform:** Integrated deployment for rapid prototyping
2. **Netlify/Vercel:** Recommended for production hosting
3. **Docker:** For containerized deployment

### Environment Configuration
- Use production API keys in deployment environment
- Configure proper CORS settings
- Set up database backups and monitoring

## Project Structure

```
afya-intelligence/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Shadcn UI components
│   │   └── ProtectedRoute.tsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # External service integrations
│   │   └── supabase/       # Supabase configuration
│   ├── lib/                # Utility functions
│   │   ├── aiInsights.ts   # AI processing logic
│   │   └── subscriptionService.ts
│   ├── pages/              # Page components and routing
│   └── index.css           # Global styles with Tailwind
├── public/                 # Static assets
├── supabase/              # Database schema and migrations
└── tests/                 # Test files
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code formatting with ESLint
- Write tests for new features
- Update documentation for API changes

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues:
- Create an issue in the GitHub repository
- Check existing documentation and FAQs
- Contact the development team

---

**Built with ❤️ for global health and wellness**
