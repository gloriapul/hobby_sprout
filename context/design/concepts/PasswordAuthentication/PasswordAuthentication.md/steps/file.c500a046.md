---
timestamp: 'Thu Oct 16 2025 21:46:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_214636.39fd4a51.md]]'
content_id: c500a0464d2891cd401a3d14f608933ca33ab5448f06ac51c5e952bf7e561283
---

# file: src/PasswordAuthentication/PasswordAuthenticationConcept.ts

```typescript
import { Collection, Db } from "mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "PasswordAuthentication" + ".";

// Generic types of this concept
type User = ID;

/**
 * Interface for the 'Users' collection documents.
 * Corresponds to:
 *   a set of Users with
 *     a username String
 *     a password String
 */
interface UserDocument {
  _id: User;           // The ID of the user, generic type
  username: string;
  password: string;    // Storing password directly as per request for this exercise
}

/**
 * PasswordAuthenticationConcept is a reusable unit of user-facing functionality
 * that supports the authentication of users using a username and password.
 *
 * **Purpose:** associate usernames and passwords with user identities for authentication purposes,
 * thereby limiting access to known users.
 *
 * **Principle:** If a user registers with a unique username and a password, they can subsequently
 * authenticate with that same username and password, and will consistently be treated as the same user.
 */
export default class PasswordAuthenticationConcept {
  private users: Collection<UserDocument>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection<UserDocument>(PREFIX + "users");
  }

  /**
   * register (username: String, password: String): (user: User)
   *
   * **requires** no User with the given `username` already exists
   *
   * **effects** creates a new User `u`; sets `u`'s username to `username`;
   *             stores the `password` for `u`; returns `u` as `user`
   */
  public async register(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    // Precondition check: no User with the given `username` already exists
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      // Precondition failed: return error as per overloaded action signature
      return { error: `Username '${username}' is already taken.` };
    }

    // Effects: create a new User document
    const newUser: User = freshID() as User; // Generate a fresh ID for the new user

    await this.users.insertOne({
      _id: newUser,
      username,
      password, // Store plain password as per the simplified requirement
    });

    // Return the new User ID as per action signature
    return { user: newUser };
  }

  /**
   * authenticate (username: String, password: String): (user: User)
   *
   * **requires** a User with the given `username` exists AND the `password` matches the stored `password` for that user
   *
   * **effects** returns the identifier of the authenticated `User` as `user`
   */
  public async authenticate(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    // Precondition check: a User with the given `username` exists
    const userDoc = await this.users.findOne({ username });
    if (!userDoc) {
      // Precondition failed: user not found. Return generic error for security.
      return { error: "Invalid username or password." };
    }

    // Precondition check: `password` matches the stored `password`
    // Direct comparison for this exercise, NOT SECURE for production.
    if (password !== userDoc.password) {
      // Precondition failed: password mismatch. Return generic error for security.
      return { error: "Invalid username or password." };
    }

    // Effects: return the authenticated User ID
    return { user: userDoc._id };
  }

  /**
   * _getUserByUsername (username: String): (user: User)
   *
   * **requires** a User with the given `username` exists
   *
   * **effects** returns the identifier of the User as `user`
   */
  public async _getUserByUsername(
    { username }: { username: string },
  ): Promise<Array<{ user: User }> | { error: string }> {
    // Precondition check: a User with the given `username` exists
    const userDoc = await this.users.findOne({ username });
    if (!userDoc) {
      // Precondition failed: user not found. Return error.
      return { error: `No user found with username '${username}'.` };
    }
    // Effects: return an array containing the user's ID
    return [{ user: userDoc._id }];
  }
}
```
