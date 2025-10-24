# Commercial Model Builder - Backend API

This is the backend API for the Commercial Model Builder application.

## Features

- RESTful API for pricing models
- Module catalogue management
- Revenue projection calculations
- CORS enabled for frontend integration
- Health check endpoint

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Models
- `GET /api/models` - Get all models
- `GET /api/models/:id` - Get model by ID
- `POST /api/models` - Create new model
- `PUT /api/models/:id` - Update model
- `DELETE /api/models/:id` - Delete model
- `POST /api/models/:id/duplicate` - Duplicate model

### Modules
- `GET /api/modules/catalogue` - Get module catalogue
- `POST /api/modules/catalogue` - Add module to catalogue
- `PUT /api/modules/catalogue/:id` - Update module in catalogue
- `DELETE /api/modules/catalogue/:id` - Delete module from catalogue

### Projections
- `POST /api/projections` - Create new projection
- `GET /api/projections/model/:modelId` - Get projections for a model
- `GET /api/projections/:id` - Get projection by ID
- `DELETE /api/projections/:id` - Delete projection

### Health Check
- `GET /health` - API health status

## Development

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run tests

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── models/         # Data models and services
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── utils/          # Utility functions
│   └── server.js       # Main server file
├── package.json
└── README.md
```

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- Authentication and authorization
- Data validation with Joi/Zod
- API documentation with Swagger
- Unit and integration tests
- Docker containerization
