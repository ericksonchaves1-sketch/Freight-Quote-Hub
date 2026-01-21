# FreightFlow - Logistics Quote Management Platform

## Overview

FreightFlow is a B2B logistics platform that connects shippers (clients) with freight carriers. The application enables clients to create freight quote requests, carriers to submit competitive bids, and provides administrative oversight through audit logging. The system supports role-based access control with four user types: admin, client, carrier, and auditor.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts for dashboard analytics

The frontend follows a component-based architecture with:
- Reusable UI components in `client/src/components/ui/` (shadcn/ui)
- Feature components like `Layout`, `QuoteCard`, `StatsCard`
- Custom hooks for authentication (`use-auth`), quotes (`use-quotes`), and toasts
- Pages organized in `client/src/pages/` for Dashboard, Quotes, Auth, and Admin views

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas

The backend uses a storage abstraction pattern (`server/storage.ts`) that implements an `IStorage` interface, making it easier to swap database implementations if needed.

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Definition**: Shared schema in `shared/schema.ts` using drizzle-zod for validation
- **Migrations**: Drizzle Kit for schema migrations (`drizzle.config.ts`)

Core entities:
- Companies (clients and carriers)
- Users (with role-based access)
- Addresses (linked to companies)
- Quotes (freight requests from clients)
- Bids (carrier responses to quotes)
- Audit Logs (system activity tracking)

### Shared Code Architecture
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts`: Database schema definitions and Zod insert schemas
- `routes.ts`: API route definitions with input/output schemas for type-safe API calls

### Build System
- **Development**: Vite for frontend HMR, tsx for backend TypeScript execution
- **Production**: esbuild bundles server code, Vite builds static frontend assets
- **Output**: Combined into `dist/` directory with server as `index.cjs` and static files in `dist/public`

## External Dependencies

### Database
- **PostgreSQL**: Primary database (connection via `DATABASE_URL` environment variable)
- **Drizzle ORM**: Database access and query building
- **connect-pg-simple**: Session storage in PostgreSQL

### Authentication & Security
- **Passport.js**: Authentication middleware
- **passport-local**: Username/password authentication strategy
- **express-session**: Session management
- **scrypt**: Password hashing (Node.js crypto module)

### UI Framework
- **shadcn/ui**: Pre-built accessible React components
- **Radix UI**: Headless UI primitives (dialogs, dropdowns, forms, etc.)
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Data Fetching & Forms
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management
- **Zod**: Schema validation for forms and API contracts

### Visualization
- **Recharts**: Chart library for dashboard analytics
- **date-fns**: Date formatting and manipulation

### Development Tools
- **Vite**: Frontend build tool with HMR
- **esbuild**: Fast JavaScript bundler for production server builds
- **TypeScript**: Type checking across the entire codebase