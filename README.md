# Prescriptions Manager

A modern prescription management system for healthcare professionals. Create, search, and manage prescription templates efficiently with optional AI enhancement.

## Features

### Core Functionality
- **Prescription Management**: Create, update, delete, and search for prescription templates
- **Disease Management**: Search and manage diseases with ICD-10 codes
- **Medication Database**: Comprehensive medication database with dosage forms and strengths
- **Smart Search**: Efficient search across diseases, medications, and prescriptions
- **Template System**: Reusable prescription templates for common conditions

### AI Enhancement (Optional)
- **Intelligent Search**: AI-powered search suggestions and results enhancement
- **Prescription Recommendations**: AI suggestions based on symptoms and conditions
- **Drug Interaction Checking**: AI-powered validation of prescriptions
- **Dosage Calculation**: Smart dosage recommendations based on patient data

### User Interface
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface built with React and Tailwind CSS
- **Real-time Search**: Instant search results as you type
- **Bulk Operations**: Efficient management of multiple prescriptions

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Hono.js on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Build Tool**: Vite
- **Deployment**: Cloudflare Workers
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18 or later
- npm or yarn package manager
- Cloudflare account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd prescriptions-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Create D1 database
   npx wrangler d1 create prescriptions-db
   
   # Update wrangler.jsonc with the database ID from the output above
   
   # Run migrations
   npx wrangler d1 execute prescriptions-db --local --file=migrations/0001_initial_schema.sql
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

### Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run cf-typegen` - Generate Cloudflare bindings types

### Database Commands

- `npm run db:migrate` - Apply migrations locally
- `npm run db:deploy` - Apply migrations to production

## Project Structure

```
prescriptions-demo/
├── src/
│   ├── components/          # React components
│   │   ├── App.tsx         # Main application component
│   │   ├── SearchBar.tsx   # Search functionality
│   │   ├── PrescriptionCard.tsx
│   │   ├── CreatePrescriptionModal.tsx
│   │   └── ConfigPanel.tsx
│   ├── lib/                # Business logic
│   │   ├── database.ts     # Database operations
│   │   └── ai.ts          # AI integration (optional)
│   ├── types.ts           # TypeScript definitions
│   ├── index.tsx          # API routes and main app
│   ├── renderer.tsx       # HTML renderer
│   └── style.css          # Tailwind CSS styles
├── migrations/             # Database migrations
├── public/                # Static assets
├── package.json
├── wrangler.jsonc         # Cloudflare Workers config
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS config
└── tsconfig.json          # TypeScript configuration
```

## API Endpoints

### Search
- `POST /api/search` - Universal search across all entities

### Diseases
- `GET /api/diseases` - List/search diseases
- `GET /api/diseases/:id` - Get disease details
- `POST /api/diseases` - Create new disease
- `GET /api/diseases/:id/prescriptions` - Get prescriptions for disease

### Medications
- `GET /api/medications` - List/search medications
- `GET /api/medications/:id` - Get medication details
- `POST /api/medications` - Create new medication

### Prescriptions
- `GET /api/prescriptions` - List/search prescription templates
- `GET /api/prescriptions/:id` - Get prescription details
- `POST /api/prescriptions` - Create new prescription template
- `PUT /api/prescriptions/:id` - Update prescription template
- `DELETE /api/prescriptions/:id` - Delete prescription template

### Configuration
- `GET /api/config/:key` - Get configuration value
- `PUT /api/config/:key` - Update configuration value

## Database Schema

### Core Tables
- `diseases` - Disease information with ICD-10 codes
- `medications` - Medication database with dosage forms
- `prescription_templates` - Reusable prescription templates
- `prescription_items` - Individual medications in prescriptions
- `disease_prescriptions` - Disease-prescription associations

### Supporting Tables
- `search_logs` - Search analytics
- `ai_suggestions` - AI suggestion cache
- `app_config` - Application configuration

## AI Integration

The application supports optional AI integration for enhanced functionality:

1. **Enable AI Features**: Toggle AI features in the Settings panel
2. **Configure API Keys**: Set `AI_API_KEY` environment variable
3. **Select Provider**: Configure `AI_PROVIDER` (openai, anthropic, etc.)

### AI Features
- Enhanced search with intelligent suggestions
- Prescription recommendations based on symptoms
- Drug interaction and contraindication checking
- Automatic dosage calculations
- Disease pattern recognition

## Configuration

### Environment Variables
- `AI_API_KEY` - API key for AI provider (optional)
- `AI_PROVIDER` - AI provider name (default: openai)

### Application Settings
- `ai_enabled` - Enable/disable AI features
- `search_suggestions_enabled` - Enable search suggestions
- `auto_save_enabled` - Enable auto-save functionality

## Deployment

### Deploy to Cloudflare Workers

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare**
   ```bash
   npm run deploy
   ```

3. **Set up production database**
   ```bash
   npx wrangler d1 execute prescriptions-db --remote --file=migrations/0001_initial_schema.sql
   ```

### Environment Setup
Configure environment variables in Cloudflare Workers dashboard or using wrangler secrets.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- Built with modern web technologies
- Designed for healthcare professionals
- Follows medical software best practices
- Implements proper data security measures
Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
