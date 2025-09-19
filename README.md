# FHIR HL7 CQL to SQL on FHIR Converter

A proof-of-concept web application that demonstrates two distinct methods for evaluating FHIR resources for clinical quality measures:

1. **Direct CQL Evaluation**: Execute Clinical Quality Language (CQL) code directly against a set of FHIR resources
2. **SQL on FHIR Evaluation**: Convert the same CQL code into a SQL on FHIR query, execute it against a flattened view of the FHIR resources, and produce comparable results

## Features

- 🚀 Real-time CQL validation and execution
- 🔄 CQL to SQL on FHIR transpilation
- 📊 Side-by-side comparison of evaluation methods
- 📦 FHIR bundle upload and validation
- 💾 Sample datasets for quick testing
- 📈 Performance metrics comparison
- 🎨 Clean, responsive UI with dark/light theme support

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **Build Tools**: Vite, esbuild

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Neon account for cloud PostgreSQL)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/aks129/FhirQueryConverter.git
cd FhirQueryConverter
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create a .env file with:
DATABASE_URL=your_postgresql_connection_string
```

4. Run database migrations:
```bash
npm run db:push
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Build

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Deployment

### Static Frontend (Vercel)

The frontend can be deployed as a static site on Vercel:

1. Fork this repository
2. Connect your GitHub repository to Vercel
3. The deployment configuration is already set up in `vercel.json`
4. Deploy!

Note: The static deployment will only include the frontend. For full functionality, you'll need to deploy the backend API separately.

### Full Stack Deployment

For full functionality including the backend API:

1. Deploy the backend to a Node.js hosting service (Railway, Render, Heroku, etc.)
2. Set the `DATABASE_URL` environment variable
3. Update the frontend API endpoints to point to your deployed backend

## Project Structure

```
FhirQueryConverter/
├── client/              # Frontend React application
│   └── src/
│       ├── components/  # UI components
│       ├── hooks/       # Custom React hooks
│       ├── lib/         # Core logic (CQL engine, SQL transpiler)
│       └── pages/       # Application pages
├── server/              # Backend Express server
│   ├── index.ts         # Server entry point
│   └── routes.ts        # API routes
├── shared/              # Shared types and schemas
└── dist/                # Production build output
```

## Usage

1. **Enter CQL Code**: Write or paste your Clinical Quality Language code in the left panel
2. **Upload FHIR Bundle**: Drag and drop or select a FHIR bundle JSON file
3. **Evaluate**: Click "Run CQL Evaluation" to execute both evaluation methods
4. **Compare Results**: View the generated MeasureReports and SQL queries in the output panel

## Sample Data

The application includes sample CQL code and a diabetes care FHIR bundle for quick testing. Click "Load Sample Data" to get started immediately.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Vite](https://vitejs.dev/)
- FHIR resources follow [HL7 FHIR](https://www.hl7.org/fhir/) specifications