---
timestamp: 'Thu Oct 16 2025 21:35:43 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_213543.ba1fab65.md]]'
content_id: b30678e45d1cdeb43cfbb2d22947a02327b8a89edad682ec339a7c458d0c76f6
---

# file: src/PasswordAuth/PasswordAuthConcept.ts

```typescript
import { Collection, Db } from "mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { generateSalt, hashPassword, verifyPassword } from "@utils/passwordHelpers.ts";

// Declare collection prefix, use concept name
const PREFIX = "PasswordAuth" + ".";

// Generic types of this concept
type User = ID;

/**
 * Interface for the 'Users' collection documents.
 * Corresponds to:
 *   a set of Users with
 *     a username String
 *     a passwordHash String
 *     a salt String
 */
interface UserDocument {
  _id: User;           // The ID of the user, generic type
  username: string;
  passwordHash: string;
  salt: string;
}

/**
 * PasswordAuthConcept is a reusable unit of user-facing functionality
 * that supports the authentication of users using a username and password.
 *
 * **Purpose:** associate usernames and securely hashed passwords with user identities for authentication purposes.
 *
 * **Principle:** If a user registers with a unique username and a password, and then subsequently
 * provides that same username and password, they will be successfully authenticated as the registered user.
 */
export default class PasswordAuthConcept {
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
   *             securely hashes `password` with a generated salt and stores the `passwordHash` and `salt` for `u`;
   *             returns `u` as `user`
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
    const salt = await generateSalt();
    const passwordHash = await hashPassword(password, salt);

    await this.users.insertOne({
      _id: newUser,
      username,
      passwordHash,
      salt,
    });

    // Return the new User ID as per action signature
    return { user: newUser };
  }

  /**
   * login (username: String, password: String): (user: User)
   *
   * **requires** a User with the given `username` exists AND the `password` matches the stored `passwordHash` for that user
   *
   * **effects** returns the identifier of the authenticated `User` as `user`
   */
  public async login(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    // Precondition check: a User with the given `username` exists
    const userDoc = await this.users.findOne({ username });
    if (!userDoc) {
      // Precondition failed: user not found. Return generic error for security.
      return { error: "Invalid username or password." };
    }

    // Precondition check: `password` matches the stored `passwordHash`
    const isPasswordValid = await verifyPassword(
      password,
      userDoc.salt,
      userDoc.passwordHash,
    );
    if (!isPasswordValid) {
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
