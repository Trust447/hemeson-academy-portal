# Hemeson Academy | Student Result Portal

A secure, high-performance web application designed for Hemeson Academy to manage and distribute student results. This portal allows students to securely check their academic performance using unique PINs, ensuring data privacy and accessibility.

## 🚀 Key Features

- **Secure Result Checking:** PIN-based authentication system to protect student data.
- **Admin Dashboard:** Centralized management for staff to upload and manage student records.
- **Mobile-First Design:** Fully responsive interface built for parents and students on any device.
- **Real-time Updates:** Powered by Supabase for instant data synchronization.

## 🛠️ Tech Stack

- **Frontend:** React 18 with TypeScript & Vite
- **Styling:** Tailwind CSS & shadcn/ui (Radix UI Primitives)
- **Backend/Database:** Supabase (PostgreSQL)
- **State Management:** TanStack Query (React Query)
- **Animations:** Framer Motion

## 🏗️ Architecture

The project follows a modular architecture:
- `/src/components/auth`: Security and PIN validation logic.
- `/src/components/admin`: Management tools and data entry interfaces.
- `/src/integrations/supabase`: Database client configuration and Row Level Security (RLS) policies.

## 📝 License
Proprietary - Developed for Hemeson Academy.