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

#### Buy SOL
```http
POST /trade/buy-sol
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
```