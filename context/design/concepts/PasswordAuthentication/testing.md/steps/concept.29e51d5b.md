---
timestamp: 'Thu Oct 16 2025 22:17:27 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_221727.23175ab0.md]]'
content_id: 29e51d5b7a140cc2233b3cfbd07c996bd1ef23d053bc8f3abdf484c272f5a24b
---

# concept: PasswordAuthentication

```
concept PasswordAuthentication [User]

purpose associate usernames and passwords with user identities for authentication purposes, thereby limiting access to known users.

principle If a user registers with a unique username and a password, they can subsequently authenticate with that same username and password, and will consistently be treated as the same user.

state
  a set of Users with
    a username String
    a password String

actions
  register (username: String, password: String): (user: User)
    requires no User with the given `username` already exists
    effects creates a new User instance; sets that user's username to `username` and stores the `password` for that user

  register (username: String, password: String): (error: String)
    requires a User with the given `username` already exists
    effects returns an error message indicating the username is taken

  authenticate (username: String, password: String): (user: User)
    requires a User with the given `username` exists AND the `password` matches the stored `password` for that user
    effects returns the identifier of the authenticated `User` as `user`

  authenticate (username: String, password: String): (error: String)
    requires a User with the given `username` does NOT exist OR the `password` does NOT match the stored `password`
    effects returns an error message indicating invalid credentials (e.g., "Invalid username or password")
```

***
