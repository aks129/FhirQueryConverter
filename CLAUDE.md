# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (full-stack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run check

# Database migrations (requires DATABASE_URL env var)
npm run db:push
```

## Architecture Overview

This is a FHIR HL7 CQL to SQL on FHIR Converter application with dual evaluation pathways:

### Frontend (client/)
- **React + TypeScript** with Vite bundler
- **shadcn/ui components** (located in `client/src/components/ui/`)
- **Routing**: Wouter with pages in `client/src/pages/`
- **State**: TanStack Query for server state, React hooks for local state
- **Path aliases**: `@/` → `client/src/`, `@shared/` → `shared/`

### Backend (server/)
- **Express.js** server with TypeScript
- **Entry point**: `server/index.ts` - sets up middleware and routes
- **Routes**: `server/routes.ts` - API endpoints prefixed with `/api`
- **Database**: PostgreSQL via Neon with Drizzle ORM
- **Schema**: `shared/schema.ts` - database tables definition

### Core Evaluation Logic (client/src/lib/)
- **cql-engine.ts**: Simplified CQL evaluation engine that executes CQL directly against FHIR resources
- **sql-transpiler.ts**: Converts CQL to SQL on FHIR queries and executes them
- **fhir-utils.ts**: FHIR bundle validation, parsing, and statistics
- **sample-data.ts**: Pre-built test data for quick demos

## Key Implementation Details

### Dual Evaluation System
The application demonstrates two methods to evaluate FHIR resources:
1. **Direct CQL**: Parses and executes CQL define statements against FHIR bundles
2. **SQL on FHIR**: Transpiles CQL to SQL, flattens FHIR data, executes SQL queries

Both pathways generate FHIR MeasureReport resources for comparison.

### Component Structure
- Main app entry: `client/src/App.tsx` - sets up providers and routing
- Home page: `client/src/pages/home.tsx` - main interface with CQL input and evaluation
- FAQ page: `client/src/pages/faq.tsx` - detailed architecture documentation
- Custom hooks in `client/src/hooks/` for CQL/SQL evaluation logic

### Database Configuration
- Requires `DATABASE_URL` environment variable for PostgreSQL connection
- Uses Drizzle Kit for migrations (`drizzle.config.ts`)
- Tables: `evaluation_logs` and `measure_reports` for storing execution data

## Environment Setup

Development uses environment variables:
- `NODE_ENV`: Set to "development" for dev mode
- `DATABASE_URL`: PostgreSQL connection string (required for database operations)
- `PORT`: Server port (defaults to 5000)

Production build creates:
- Client assets in `dist/public/`
- Server bundle in `dist/`