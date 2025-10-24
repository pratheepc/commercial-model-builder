# Commercial Model Builder

A modern pricing model tool for SaaS products, built with React and Node.js.

## Project Structure

```
commercial-model-builder/
├── frontend/           # React frontend application
├── backend/            # Node.js/Express API server
├── requirements v1.md  # Project requirements document
└── README.md          # This file
```

## Quick Start

### Frontend (React App)

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

The frontend will be available at `http://localhost:5173`

### Backend (API Server)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## Features

### Frontend
- Modern React application with TypeScript
- shadcn/ui components with teal theme
- Expandable/collapsible sidebar navigation
- Pricing model management
- Module catalogue management
- Revenue projection calculations
- Responsive design

### Backend
- RESTful API with Express.js
- CORS enabled for frontend integration
- In-memory data storage (ready for database integration)
- Health check endpoint
- Modular architecture

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- React Hook Form
- Zod validation

### Backend
- Node.js
- Express.js
- CORS
- Helmet (security)
- Morgan (logging)
- UUID

## Development

Both frontend and backend support hot reload during development.

### Frontend Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend Commands
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests

## API Documentation

The backend provides a RESTful API with the following main endpoints:

- **Models**: `/api/models/*` - CRUD operations for pricing models
- **Modules**: `/api/modules/*` - Module catalogue and model module management
- **Projections**: `/api/projections/*` - Revenue projection calculations
- **Health**: `/health` - API health check

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- User authentication and authorization
- Data persistence
- Advanced analytics and reporting
- Export functionality (PDF, Excel)
- Real-time collaboration
- Docker containerization
- CI/CD pipeline

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
