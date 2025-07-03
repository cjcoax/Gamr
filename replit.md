# Gamr - Personal Gaming Library

## Overview

Gamr is a full-stack web application that serves as a personal gaming library and social platform. Users can track, rate, and discover games while connecting with other gaming enthusiasts. The application features a mobile-first design with a modern gaming aesthetic and comprehensive game management capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom gaming theme (dark mode optimized)
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with OpenID Connect (OIDC)
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful API with JSON responses

### Database Architecture
- **Database**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Schema**: Structured around users, games, user libraries, reviews, and social features

## Key Components

### Core Entities
1. **Users**: Authentication, profiles, and user statistics
2. **Games**: Game catalog with metadata, ratings, and categorization
3. **User Games**: Personal library management with status tracking
4. **Reviews**: User ratings and reviews for games
5. **Activities**: Social feed of user actions
6. **Sessions**: Secure session storage in PostgreSQL

### User Interface Components
- **Mobile-First Design**: Optimized for mobile with bottom navigation
- **Component System**: Reusable UI components built on Radix primitives
- **Gaming Theme**: Custom dark theme with purple/violet accent colors
- **Responsive Layout**: Centered mobile layout with max-width constraints

### Authentication Flow
- **Replit Auth Integration**: Leverages Replit's OIDC provider
- **Session Management**: Secure cookie-based sessions with PostgreSQL storage
- **User Profile**: Automatic user creation and profile management

## Data Flow

### Client-Server Communication
1. **API Layer**: RESTful endpoints for all data operations
2. **Query Management**: TanStack Query handles caching, background updates, and error states
3. **Authentication**: Session-based auth with automatic redirect handling
4. **Error Handling**: Centralized error handling with user-friendly notifications

### Database Operations
1. **User Management**: CRUD operations for user profiles and statistics
2. **Game Library**: Track game status (want to play, playing, completed)
3. **Social Features**: Activity feeds and user interactions
4. **Search & Discovery**: Game search and categorized browsing

### State Management
- **Server State**: Managed by React Query with automatic caching
- **Local State**: React hooks for component-level state
- **URL State**: Wouter for navigation and route parameters

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight routing
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development server and build tool
- **ESBuild**: Backend bundling for production
- **Drizzle Kit**: Database schema management

### Authentication & Session
- **openid-client**: OIDC authentication with Replit
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite dev server with middleware integration
- **Database**: Drizzle push for schema updates
- **Session Storage**: PostgreSQL-backed sessions
- **Error Handling**: Runtime error overlay for development

### Production Build
- **Frontend**: Vite build with optimized bundles
- **Backend**: ESBuild compilation to single file
- **Database**: Migrations via Drizzle Kit
- **Static Assets**: Served through Express

### Environment Configuration
- **Database URL**: Required for PostgreSQL connection
- **Session Secret**: Secure session signing
- **Replit Integration**: OIDC configuration for authentication

## Changelog

```
Changelog:
- July 03, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```