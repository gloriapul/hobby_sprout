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
- **Current**: "Associate usernames and passwords with user identities for authentication purposes, thereby limiting access to known users."
- **Reason for Change**: Has enhanced clarity by explicitly mentioning the association of credentials with identities, which is the core functionality of the concept.

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

## Evaluation Against Original Requirements

The core concept remained the same. 
