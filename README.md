# This is a simple auth app
Here a user can sign up, sign in, sign out, delete account and look at their information

## To get started

npx drizzle-kit generate

npx drizzle-kit migrate

npm run start:dev

## end points:

### POST /auth/signup

{
"email": "user@example.com",
"password": "password123",
"name": "John Doe"
}

### POST /auth/signin

{
"email": "user@example.com",
"password": "password123"
}

### POST /auth/signout

Authorization: Bearer your_jwt_token

### DELETE /auth/account

Authorization: Bearer your_jwt_token

{
"password": "current_password"
}

### GET /auth/me

Authorization: Bearer your_jwt_token