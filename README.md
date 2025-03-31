# Solana Exchange Node.js API

A Node.js API for managing Solana (SOL) and USDT trading operations with Supabase integration.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account and project
- Solana wallet

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd solanacex-node
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will start on port 3000 by default.

## API Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "your_password",
    "solana_public_key": "your_solana_public_key"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "your_password"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer your_jwt_token
```

### Trading

#### Sell SOL
```http
POST /trade/sell-sol
Authorization: Bearer your_jwt_token
Content-Type: application/json

{
    "email": "user@example.com",
    "token": "your_jwt_token",
    "solAmount": 1.5,
    "price": 100.50
}
```

#### Get Trade History
```http
GET /trade/history
Authorization: Bearer your_jwt_token
```

#### Get Trade Details
```http
GET /trade/:id
Authorization: Bearer your_jwt_token
```

### Profile

#### Get User Profile
```http
GET /profile
Authorization: Bearer your_jwt_token
```

## Database Schema

### Users Table
- id (UUID, primary key)
- email (string, unique)
- password_hash (string)
- solana_public_key (string)
- created_at (timestamp)
- updated_at (timestamp)

### User Balances Table
- id (UUID, primary key)
- email (string, foreign key)
- balances (jsonb)
- created_at (timestamp)
- updated_at (timestamp)

### Trades Table
- id (UUID, primary key)
- email (string, foreign key)
- public_key (string)
- type (enum: 'SOL_SELL', 'SOL_BUY')
- sol_amount (numeric)
- usdt_amount (numeric)
- price (numeric)
- previous_balance (jsonb)
- new_balance (jsonb)
- status (enum: 'PENDING', 'COMPLETED', 'FAILED')
- created_at (timestamp)
- updated_at (timestamp)

## Security Features

1. JWT Authentication
2. Password Hashing
3. Row Level Security (RLS) in Supabase
4. Input Validation
5. Error Handling

## Error Responses

All endpoints may return the following error responses:

```json
{
    "error": "Error message",
    "details": "Detailed error information (if available)"
}
```

Common HTTP Status Codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Development

### Project Structure
```
src/
├── config/
│   ├── config.js
│   └── supabase.js
├── database/
│   └── migrations/
├── middleware/
│   └── authMiddleware.js
├── routes/
│   ├── authRoutes.js
│   ├── profileRoutes.js
│   └── tradeRoutes.js
├── services/
│   ├── supabaseService.js
│   └── monitoringService.js
└── app.js
```

### Running Tests
```bash
npm test
```

### Code Style
The project uses ESLint for code linting. Run:
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 