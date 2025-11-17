# MCA System - Meta-Cognitive Assessment Platform

A comprehensive full-stack application for optimizing AI usage patterns through meta-cognitive assessment and frustration tracking.

## Technology Stack

### Frontend
- **React** 18.2.0 - UI library
- **TypeScript** 5.3.0 - Type-safe JavaScript
- **Vite** 5.0.0 - Modern frontend build tool
- **Tailwind CSS** 3.3.0 - Utility-first CSS framework
- **React Router** 6.18.0 - Client-side routing
- **Zustand** 4.4.0 - State management

### Backend
- **Node.js** with **Express** 4.18.2 - Web framework
- **TypeScript** 5.3.0 - Type-safe JavaScript
- **Prisma** 5.6.0 - ORM for database operations
- **PostgreSQL** - Database
- **Helmet** 7.1.0 - Security middleware
- **CORS** 2.8.5 - Cross-origin resource sharing
- **Zod** 3.18.0 - Schema validation

## Project Structure

```
mca-system/
├── frontend/                      # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── main.tsx              # React entry point
│   │   ├── App.tsx               # Root component
│   │   └── index.css             # Global styles with Tailwind
│   ├── index.html                # HTML entry point
│   ├── package.json              # Frontend dependencies
│   ├── tsconfig.json             # TypeScript config
│   ├── vite.config.ts            # Vite build config
│   ├── tailwind.config.js        # Tailwind CSS config
│   └── postcss.config.js         # PostCSS config
│
├── backend/                       # Node.js + Express + Prisma backend
│   ├── src/
│   │   └── index.ts              # Express server entry point
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema (15 models)
│   │   └── migrations/           # Database migrations
│   ├── package.json              # Backend dependencies
│   ├── tsconfig.json             # TypeScript config
│   ├── .env                      # Environment variables
│   └── .env.example              # Environment variables template
│
└── README.md                      # This file
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- PostgreSQL 14+ running on macOS at `192.168.18.58:5432`

### Installation

#### Backend Setup
```bash
cd mca-system/backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

#### Frontend Setup
```bash
cd mca-system/frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and proxy API requests to `http://localhost:3000/api`.

## Database Models (15 Total)

### User Management
- **User** - User account and authentication
- **SkillBaseline** - Baseline skill measurements
- **SkillTest** - Skill assessment results
- **SkillAlert** - Alerts for skill atrophy or over-reliance

### Session & Interaction Tracking
- **Session** - AI interaction sessions
- **Interaction** - Individual AI request/response pairs
- **PatternLog** - Detected usage patterns (A-F)
- **MetacognitiveMetric** - 12-dimensional feature vectors

### Model Comparison
- **ModelComparison** - Cross-model testing results

### MCA System Data
- **MetaRequirement** - 20 Meta-Requirements (MR1-MR20)
- **Frustration** - 143 User Frustrations (UF001-UF143)
- **AlternativeStrategy** - 87 Alternative Strategies (AS001-AS087)

### Assessment & Feedback
- **Assessment** - Meta-cognitive assessment results
- **FrustrationReport** - User-reported frustration experiences

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /api` - API documentation

### Planned Endpoints
- `GET/POST /api/users` - User management
- `GET /api/frustrations` - Frustration catalog
- `GET /api/strategies` - Alternative strategies
- `GET/POST /api/assessments` - Assessment management
- `GET/POST /api/sessions` - Session tracking

## Environment Configuration

### Backend (.env)
```
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://wuqi@192.168.18.58:5432/mca_system"
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-secret-key-change-in-production
API_LOG_LEVEL=debug
```

## Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run compiled application
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run pending migrations
- `npm run prisma:studio` - Open Prisma Studio (database UI)
- `npm run type-check` - Check TypeScript types
- `npm run lint` - Lint code

### Frontend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run type-check` - Check TypeScript types
- `npm run lint` - Lint code

## Data Schema

The system tracks:
- **143 User Frustrations** - Issues users encounter with AI
- **87 Alternative Strategies** - Evidence-based solutions
- **20 Meta-Requirements** - Key requirements for optimal AI usage
- **12 Metacognitive Metrics** - Features for pattern recognition
- **Usage Patterns A-F** - Different AI usage behaviors

## Development

### Adding New Routes
1. Create a new file in `backend/src/routes/`
2. Import and mount the route in `src/index.ts`
3. Update the API endpoints documentation

### Database Changes
1. Update `backend/prisma/schema.prisma`
2. Run `npm run prisma:migrate` to create migration
3. Prisma Client will auto-generate types

### Frontend Pages
1. Create new components in `frontend/src/components/`
2. Add routes in React Router configuration
3. Use API client services to fetch data

## Deployment

### Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

### Running in Production
```bash
# Backend
NODE_ENV=production node dist/index.js

# Frontend
npm run preview
```

## Contributing

1. Work on feature branches
2. Ensure TypeScript compilation succeeds
3. Run linting before committing
4. Update database schema in Prisma if needed

## Data Sources

- **Frustrations & Strategies**: Derived from 49 structured interviews (588 coding instances)
- **Meta-Requirements**: Synthesized from interview analysis
- **Patterns A-F**: Behavioral patterns identified in usage analysis

## License

MIT
