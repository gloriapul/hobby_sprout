# Design Changes for PasswordAuthentication Concept

This document reflects on the changes for the PasswordAuthentication concept from its initial specification in the assignment to this final implementation.

## Original Concept Design (Assignment 2)

```
concept PasswordAuthentication
purpose limit access to known users
principle after a user registers with a username and a password, they can authenticate with that same username and password and be treated each time as the same user
state 
  a set of Users with
    a username String
    a password String
actions
  register (username: String, password: String): (user: User)
    requires the username to not already exist
    effects create a new username with the corresponding password
  authenticate (username: String, password: String): (user: User)
    requires username to exist and for password to correspond to it
```

## Changes Made During Implementation

### Purpose Statement
- **Original**: "limit access to known users"
- **Current**: "associate usernames and passwords with user identities for authentication purposes, thereby limiting access to known users"
- **Reason for Change**: Has enhanced clarity by explicitly mentioning the association of credentials with identities, which is the core functionality of the concept.

### Principle Statement
- **Original**: "after a user registers with a username and a password, they can authenticate with that same username and password and be treated each time as the same user"
- **Current**: "If a user registers with a unique username and a password, they can subsequently authenticate with that same username and password, and will consistently be treated as the same user."
- **Reason for Change**: Minor wording improvements for clarity and added emphasis on username uniqueness.

### State Definition
- **Original**: "a set of Users with a username String, a password String"
- **Current**: Maintained the same conceptual state but implemented as a MongoDB collection with User documents containing `_id`, `username`, and `password` fields.
- **Reason for Change**: Implementation details added while preserving the conceptual structure.

### Action: register
- **Original**: 
  ```
  register (username: String, password: String): (user: User)
    requires the username to not already exist
    effects create a new username with the corresponding password
  ```
- **Current**: Added explicit error handling by implementing an overloaded version that returns an error when the username already exists.
  ```typescript
  register({ username, password }): Promise<{ user: User } | { error: string }>
  ```
- **Reason for Change**: Enhanced robustness by explicitly handling failure cases with meaningful error messages.

### Action: authenticate
- **Original**: 
  ```
  authenticate (username: String, password: String): (user: User)
    requires username to exist and for password to correspond to it
  ```
- **Current**: Added explicit error handling for authentication failures with generic error messages for security.
  ```typescript
  authenticate({ username, password }): Promise<{ user: User } | { error: string }>
  ```
- **Reason for Change**: Improved security by implementing proper authentication error handling that doesn't reveal whether the username exists or the password is incorrect.

## Additional Implementation Details

1. **User ID Generation**: Added the use of `freshID()` to create unique user IDs instead of using usernames as identifiers.

2. **Database Integration**: Implemented MongoDB collection setup with proper namespacing using a prefix.

3. **Type Safety**: Added TypeScript interfaces and types for better code reliability:
   - `User` type for IDs
   - `UserDocument` interface for database documents

4. **Security Considerations**:
   - Used generic error messages for authentication failures to prevent user enumeration
   - Using a string currently for password storing

5. **Error Messages**:
   - Registration: `Username '{username}' is already taken.`
   - Authentication: `Invalid username or password.` (generic message for both unknown username and incorrect password)

## Evaluation Against Original Requirements

The core concept remained the same unchanged. 
