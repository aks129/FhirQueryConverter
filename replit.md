# FHIR HL7 CQL to SQL on FHIR Converter

## Overview

This is a proof-of-concept web application that demonstrates two distinct methods for evaluating FHIR resources for clinical quality measures:

1. **Direct CQL Evaluation**: Execute Clinical Quality Language (CQL) code directly against a set of FHIR resources
2. **SQL on FHIR Evaluation**: Convert the same CQL code into a SQL on FHIR query, execute it against a flattened view of the FHIR resources, and produce comparable results

The application provides a clean two-panel interface where users can input CQL code and upload FHIR bundles, then compare the results from both evaluation methods. Both pathways generate FHIR MeasureReport resources as output.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React hooks with TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Code Editor**: Custom textarea components for CQL input with validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful endpoints prefixed with `/api`
- **Session Management**: Built-in session handling with connect-pg-simple

### Build System
- **Development**: Vite dev server with HMR
- **Production**: Vite build + esbuild for server bundling
- **TypeScript**: Strict mode enabled with path mapping for clean imports

## Key Components

### CQL Engine (`client/src/lib/cql-engine.ts`)
- Simplified CQL evaluation engine for proof-of-concept
- Parses CQL define statements and evaluates them against FHIR resources
- Generates FHIR MeasureReport resources with execution metrics
- Supports basic CQL constructs for clinical quality measures

### SQL Transpiler (`client/src/lib/sql-transpiler.ts`)
- Converts CQL code to SQL on FHIR queries
- Flattens FHIR bundle data into relational views
- Executes SQL queries using in-memory database simulation
- Produces equivalent MeasureReport output for comparison

### FHIR Utilities (`client/src/lib/fhir-utils.ts`)
- FHIR bundle validation and parsing
- Bundle statistics calculation
- Resource type classification and analysis
- Sample data generation for testing

### UI Components
- **CQL Input**: Advanced textarea with validation and syntax highlighting
- **FHIR Upload**: Drag-and-drop file upload with validation
- **JSON Viewer**: Formatted JSON display with copy functionality
- **Output Panel**: Tabbed interface showing results from both evaluation methods
- **FAQ Page**: Comprehensive architecture documentation with step-by-step backend methodology explanations

## Data Flow

1. **Input Phase**: User enters CQL code and uploads a FHIR bundle
2. **Validation**: CQL syntax and FHIR bundle structure are validated
3. **Dual Evaluation**:
   - CQL path: Direct execution against FHIR resources
   - SQL path: CQL-to-SQL conversion followed by query execution
4. **Result Generation**: Both paths produce FHIR MeasureReport resources
5. **Comparison**: Side-by-side display of results with performance metrics

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Data fetching and caching
- **wouter**: Lightweight React router

### UI Libraries
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

### Development Tools
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development
- Vite dev server with hot module replacement
- TypeScript compilation with strict checking
- Environment-based configuration

### Production
- Static frontend build served by Express
- Node.js backend with compiled TypeScript
- Database migrations via Drizzle Kit
- Environment variables for configuration

### Database Schema
The application uses two main tables:
- `evaluation_logs`: Stores execution logs and performance metrics
- `measure_reports`: Stores generated MeasureReport resources with metadata

### Key Features
- Real-time CQL validation with helpful error messages
- Sample datasets for quick testing
- Performance comparison between evaluation methods
- Export functionality for MeasureReports and generated SQL
- Responsive design with mobile support
- Dark/light theme support via CSS variables

This architecture provides a solid foundation for demonstrating the flexibility of using either CQL or SQL for FHIR data analysis while maintaining clean separation of concerns and type safety throughout the application.