# Commercial Model Builder - Frontend

A modern React frontend for the Commercial Model Builder pricing tool.

## Features

- **Pricing Model Management**: Create, edit, and manage pricing models
- **Module System**: Add modules with different pricing structures (flat, per-unit, slab-based)
- **Slab-Based Pricing**: Configure tiered pricing with minimum and maximum units
- **Revenue Projections**: Generate revenue forecasts based on unit growth
- **Modern UI**: Clean, responsive design with shadcn/ui components and teal theme
- **TypeScript**: Full type safety throughout the application
- **Sidebar Navigation**: Expandable/collapsible sidebar with smooth transitions

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── ModelForm.tsx  # Model creation/editing form
│   ├── ModelTable.tsx # Models listing table
│   ├── Sidebar.tsx    # Navigation sidebar
│   └── ...
├── lib/               # Utility functions and calculations
├── types/             # TypeScript type definitions
└── main.tsx          # Application entry point
```

## Key Components

### Navigation
- **Sidebar**: Expandable/collapsible navigation with icons and labels
- **Responsive Design**: Adapts to different screen sizes
- **Smooth Transitions**: 300ms animations for state changes

### Model Management
- Create new pricing models with name and description
- Edit model configuration (starting units, minimum fee, implementation fee)
- Duplicate existing models
- Delete models with confirmation
- Click-to-view model details

### Module System
- **Module Catalogue**: Manage predefined modules
- **Model Modules**: Add modules to pricing models
- Configure pricing types: flat, per-unit, or slab-based
- Set minimum fees and monthly fees
- Manage pricing slabs with tiered rates

### Revenue Projections
- Generate revenue forecasts based on unit growth
- Support for linear and percentage growth
- Export projection results
- Visualize revenue progression over time

## Technology Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components with teal theme
- **React Hook Form** - Form handling and validation
- **Zod** - Schema validation
- **Lucide React** - Beautiful icons

## Design System

The application uses a consistent design system with:
- **Teal Color Theme**: Professional teal colors for primary actions
- **Clean Interface**: Minimal, modern design
- **Responsive Layout**: Works on all screen sizes
- **Accessible Components**: Proper ARIA labels and keyboard navigation
- **Consistent Spacing**: Uniform padding and margins
- **Smooth Animations**: Transitions for better UX

## Data Models

### Model
- Basic model information (name, description)
- Configuration (starting units, minimum fee, implementation fee)
- Associated modules and their pricing structures

### Module
- Module name and pricing type
- Fee configuration (monthly, minimum, per-unit rates)
- Slab-based pricing tiers

### Projection
- Growth parameters (type, value, periods)
- Revenue calculations based on model configuration
- Export capabilities

## Development

The project uses modern development practices:
- Hot module replacement for fast development
- TypeScript for type safety
- ESLint for code quality
- Component-based architecture
- Custom hooks for state management

## Building for Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Preview the production build:
   ```bash
   npm run preview
   ```

The built files will be in the `dist/` directory.

## API Integration

The frontend is designed to work with the backend API:
- Models API: `/api/models/*`
- Modules API: `/api/modules/*`
- Projections API: `/api/projections/*`

Currently uses mock data service, ready for API integration.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details