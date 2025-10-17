---
timestamp: 'Thu Oct 16 2025 21:46:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_214636.39fd4a51.md]]'
content_id: 3ebfbb564fbcfe88cdedc266a562773b759846ec4540e9c4ac4f6cea54694c83
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
    effects creates a new User `u`; sets `u`'s username to `username`; stores the `password` for `u`; returns `u` as `user`

  register (username: String, password: String): (error: String)
    requires a User with the given `username` already exists
    effects returns an error message indicating the username is taken

  authenticate (username: String, password: String): (user: User)
    requires a User with the given `username` exists AND the `password` matches the stored `password` for that user
    effects returns the identifier of the authenticated `User` as `user`

  authenticate (username: String, password: String): (error: String)
    requires a User with the given `username` does NOT exist OR the `password` does NOT match the stored `password`
    effects returns an error message indicating invalid credentials (e.g., "Invalid username or password")

queries
  _getUserByUsername (username: String): (user: User)
    requires a User with the given `username` exists
    effects returns the identifier of the User as `user`

  _getUserByUsername (username: String): (error: String)
    requires a User with the given `username` does NOT exist
    effects returns an error message indicating no such user
```

***

**Important Note on Security:**
As previously discussed, storing plain passwords (`password String`) is highly insecure and **should never be done in production systems**. Passwords should always be securely hashed and salted using strong, one-way cryptographic functions. This simplification is made solely for this specific educational exercise as per your TA's guidance.

The `passwordHelpers.ts` utility file is no longer needed with this simplified approach, so it will not be included.

***
