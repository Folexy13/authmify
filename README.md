### NestJS Authentication API with GraphQL

![App Overview](https://hlsnigeria.com.ng/static/home_images/bannerdoctor.png)

A secure authentication system with standard and biometric login options, built with NestJS, GraphQL, and Prisma.

## Table of Contents

- Features
- Getting Started
- API Usage
- Testing
- Future Improvements
- Contributing
- License

## Features

- JWT-based authentication
- Standard email/password login
- Biometric authentication
- GraphQL API
- Secure password hashing
- Unit and e2e tests

## Getting Started

## Prerequisites

- Node.js v16+
- PostgreSQL
- npm/yarn

### Installation

1. Clone the repo:
   ```
   git clone https://github.com/your-username/nestjs-auth-api.git
   cd nestjs-auth-api
   ```

2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment:
   ```
   cp .env.example .env
    ```


4. Start the database:
    ```
    docker-compose up -d
   ```

5. Run migrations:
   ```
    npx prisma migrate dev --name init
    ```

6. Start the server:
    ```
    npm run start:dev
   ```

## API Usage

### Access GraphQL Playground at http://localhost:8002/graphql.

## User Registration

```
    mutation Register {
        register(input: {
        email: "user@example.com",
        password: "securePassword123"
        }) {
        access_token
        }
    }
    
```

## Standard Login

```
    mutation Login {
        login(input: {
        email: "user@example.com",
        password: "securePassword123"
        }) {
        access_token
        }
    }

```

## Biometric Setup

### Add JWT to headers:

```
{
"Authorization": "Bearer YOUR_TOKEN"
}
```

### Run mutation:

```
    mutation SetupBiometric {
        setupBiometric(biometricKey: "device-fingerprint-xyz")
    }
```

## Testing

### Run unit tests:

```
npm run test
```

### Run end-to-end tests:

```
npm run test:e2e
```

### Future Improvements

Priority Features

- Role-Based Access Control:
    - Add roles to users to define permissions in the system.

  model User {
  ...
  role Role @default(USER)
  }

  enum Role {
  USER
  ADMIN
  MODERATOR
  }

- Enhanced Security:
    - Rate limiting
    - Suspicious activity detection
    - Two-factor authentication

- User Management:
    - Password reset flows
    - Email verification
    - Session management

License

MIT © 2023 Aluko Folajimi. O.
