# Design Changes for PasswordAuthentication

## Initial Design
- Based on specification, implemented simple username/password authentication
- Used MongoDB for user storage
- Implemented register and authenticate actions

## Design Decision 1: Error Messages
- For security reasons, decided to return generic error messages for failed authentication
- "Invalid username or password" doesn't reveal which credential was incorrect
- Prevents attackers from enumerating valid usernames

## Design Decision 2: Storing Passwords
- For this educational implementation, passwords are stored directly
- In a real implementation, would use bcrypt or another secure hashing algorithm
- Would add salt and iterations for additional security

## Design Decision 3: Return Type Structure
- Used union type { user: ID } | { error: string } for consistent returns
- Allows for uniform error handling across actions
- Follows LikertSurvey pattern for consistency

## Design Decision 4: Test Structure
- Created three focused tests following LikertSurvey pattern:
  1. Principle test: Registration and authentication flow
  2. Username uniqueness test: Verifies duplicate registration fails
  3. Authentication failure test: Verifies invalid credentials fail

## Design Decision 5: Database Structure
- Used a single "users" collection with username and password fields
- Considered indexing username for faster lookups and uniqueness constraints
- Simple schema aligned with the concept's purpose