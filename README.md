# SDG Wellspring Health

## Project Overview

SDG Wellspring Health is a web application designed to empower individuals in tracking their health journey while contributing to the United Nations Sustainable Development Goal 3: Good Health and Well-Being. The platform offers symptom tracking, AI-driven health insights, educational content on SDG 3 targets, and tiered subscription plans.

## Features

*   **User Authentication:** Secure signup and login powered by Supabase.
*   **Symptom Tracking:** Users can log symptoms with severity levels, contributing to personal health records and aggregated data for global health insights.
*   **AI Health Insights:** Provides basic AI-driven patterns and alerts based on logged symptoms (currently mocked, with potential for future expansion).
*   **SDG 3 Education Hub:** Interactive content explaining UN SDG 3 targets and how user contributions make an impact.
*   **Tiered Subscriptions:** Offers different plans (Community Advocate, Health Champion, Global Advocate) with varying features, with payments handled via Intasend.
*   **PWA Support:** Installable as a Progressive Web App for an enhanced mobile experience and offline capabilities.
*   **Dark Mode:** User-toggleable dark mode for improved accessibility and user preference.
*   **Data Export:** Users on higher tiers can export their symptom data.

## System Architecture

The application follows a modern web architecture, primarily a React frontend interacting with a Supabase backend.

*   **Frontend:**
    *   **Framework:** React with TypeScript
    *   **Build Tool:** Vite
    *   **Styling:** Tailwind CSS with Shadcn UI components for a consistent and responsive design. Custom health-themed styles are defined in `src/index.css`.
    *   **Routing:** `react-router-dom` for client-side navigation, including protected routes for authenticated users.
    *   **State Management:** React's `useState` and `useEffect` for local component state, `AuthContext` for global authentication state, and `@tanstack/react-query` for server state management (fetching and mutating data with Supabase).

*   **Backend & Database:**
    *   **Platform:** Supabase (an open-source Firebase alternative).
    *   **Authentication:** Supabase Auth handles user registration, login, and session management.
    *   **Database:** PostgreSQL database managed by Supabase, storing user profiles, symptoms, SDG content, and community impact data. Row Level Security (RLS) is enabled to ensure data privacy.

*   **Payment Gateway:**
    *   **Provider:** Intasend
    *   **Integration:** Client-side integration using the Intasend inline JavaScript SDK for processing payments for tier upgrades. Payment initiation is handled directly by the Intasend button, with status updates communicated via event listeners.

## Design Principles

The application is built with a focus on:

*   **User-Centric Design:** Intuitive interfaces for logging symptoms and navigating health data.
*   **Accessibility:** Efforts made to ensure form elements have proper labels (e.g., using `aria-label`).
*   **Responsiveness:** Designed to be fully functional and visually appealing across various devices (desktop, tablet, mobile).
*   **Theming:** Supports light and dark modes, allowing users to customize their viewing experience.

## Integrations & APIs

*   **Supabase:**
    *   **Purpose:** User authentication, user profile management, and primary data storage for symptoms, education progress, and other application data.
    *   **Configuration:** API keys and project URL are managed via environment variables.
*   **Intasend:**
    *   **Purpose:** Facilitates secure payment collection for premium subscription tiers.
    *   **Integration Type:** Client-side Payment Button using the Intasend inline SDK.
    *   **Configuration:** Requires an Intasend Publishable Key, typically loaded from environment variables.

## Usage Examples

### Getting Started

1.  **Sign Up / Log In:** Navigate to the `/auth` page to create a new account or sign in with existing credentials.
2.  **Dashboard:** Upon successful login, you will be redirected to the dashboard to start tracking your health.

### Logging a Symptom

1.  On the Dashboard, click the "Log Symptom" button.
2.  Fill in the symptom description and select its severity.
3.  Click "Log Symptom" to save it to your personal health record.

### Upgrading Your Subscription Tier

1.  Navigate to the Profile page.
2.  In the "Subscription" section, if an upgrade is available, click the "Upgrade to [Tier Name]" button.
3.  The Intasend payment interface will appear, guiding you through the payment process.
4.  Upon successful payment, your subscription tier will be updated.

## Local Development Setup

To set up the project locally, follow these steps:

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/PLP-Academy/sdg-wellspring-health.git
    cd sdg-wellspring-health
    ```
2.  **Install dependencies:**
    ```sh
    npm install
    ```
3.  **Environment Variables:** Create a `.env` file in the root directory and add your Supabase and Intasend API keys.
    ```
    VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
    VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    # INTASEND_PUBLISHABLE_KEY="YOUR_INTASEND_PUBLISHABLE_KEY" # This should be set directly in src/pages/Profile.tsx for client-side SDK
    ```
    *Note: The Intasend Publishable Key is currently hardcoded in `src/pages/Profile.tsx` for client-side SDK initialization. For production, consider a more secure way to manage this key.*

4.  **Run Supabase Migrations (if applicable):**
    If you have local Supabase changes or need to apply migrations, ensure your Supabase CLI is set up and run:
    ```sh
    npx supabase db push
    ```
5.  **Start the development server:**
    ```sh
    npm run dev
    ```
    The application will be accessible at `http://localhost:8080/`.

## Deployment

This project can be easily deployed via Lovable. Visit the [Lovable Project](https://lovable.dev/projects/80c14169-96fb-4f15-a1ba-f7d8fb9296cc) and click on Share -> Publish.

### Custom Domain

To connect a custom domain, navigate to Project > Settings > Domains and click Connect Domain.
Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
