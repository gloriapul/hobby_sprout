---
timestamp: 'Thu Oct 16 2025 21:48:21 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_214821.504fbb1f.md]]'
content_id: baab77a3d4decc50a82f8c4869c24e86923a86afe0d329ac42b4b51aa16ce40b
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
    effects creates a new User instance; sets that user's username to `username`; stores the `password` for that user; returns the ID of that newly created user as `user`

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

**Important Note on Security:**
As previously discussed, storing plain passwords (`password String`) is highly insecure and **should never be done in production systems**. Passwords should always be securely hashed and salted using strong, one-way cryptographic functions. This simplification is made solely for this specific educational exercise as per your TA's guidance.

***
