[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

# implement: PasswordAuthentication
# response:

*   **concept**: PasswordAuthentication \[User]
*   **purpose**: Associate usernames and passwords with user identities for authentication purposes, thereby limiting access to known users.
*   **principle**: If a user registers with a unique username and a password, they can subsequently authenticate with that same username and password, and will consistently be treated as the same user.
*   **state**:
    *   A set of `Users` with
        *   a `username` of type `String`
        *   a `password` of type `String`
*   **actions**:
    *   `register(username: String, password: String): (user: User)`
        *   **requires**: No `User` with the given `username` already exists.
        *   **effects**: Creates a new `User` instance; sets that user's username to `username` and stores the `password` for that user; returns the user ID.
    
    *   `register(username: String, password: String): (error: String)`
        *   **requires**: A `User` with the given `username` already exists.
        *   **effects**: Returns an error message indicating the username is taken.
    
    *   `authenticate(username: String, password: String): (user: User)`
        *   **requires**: A `User` with the given `username` exists AND the `password` matches the stored `password` for that user.
        *   **effects**: Returns the identifier of the authenticated `User` as `user`.
    
    *   `authenticate(username: String, password: String): (error: String)`
        *   **requires**: A `User` with the given `username` does NOT exist OR the `password` does NOT match the stored `password`.
        *   **effects**: Returns an error message indicating invalid credentials (e.g., "Invalid username or password").

# file: src/PasswordAuthentication/PasswordAuthenticationConcept.ts

# final 

```typescript
import { Collection, Db } from "mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "PasswordAuthentication" + ".";

// Generic types for this concept
type User = ID;

/**
 * Interface for the 'Users' collection documents.
 * Corresponds to:
 *   a set of Users with
 *     a username String
 *     a password String
 */
interface UserDocument {
  _id: User; // The ID of the user, generic type
  username: string;
  password: string; // Storing password directly, string was specified to be sufficient
}

/**
 * @concept PasswordAuthentication
 * @purpose associate usernames and passwords with user identities for authentication purposes,
 * thereby limiting access to known users.
 */
export default class PasswordAuthenticationConcept {
  private users: Collection<UserDocument>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection<UserDocument>(PREFIX + "users");
  }

  /**
   * register (username: String, password: String): (user: User)
   *
   * @requires no User with the given `username` already exists
   *
   * @effects creates a new User instance; sets that user's username to `username`;
   *             stores the `password` for that user; returns the ID of that newly created user as `user`
   */
  async register(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    // no User with the given `username` already exists
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: `Username '${username}' is already taken.` };
    }

    // create a new User document
    const newUser: User = freshID() as User; // generate a fresh ID for the new user

    await this.users.insertOne({
      _id: newUser,
      username,
      password, // store password
    });

    // new user created
    return { user: newUser };
  }

  /**
   * authenticate (username: String, password: String): (user: User)
   *
   * @requires a User with the given `username` exists AND the `password` matches the stored `password` for that user
   *
   * @effects returns the identifier of the authenticated `User` as `user`
   */
  async authenticate(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    // a User with the given `username` exists
    const userDoc = await this.users.findOne({ username });
    if (!userDoc) {
      // user not found. Return generic error for security.
      return { error: "Invalid username or password." };
    }

    // `password` matches the stored `password`
    if (password !== userDoc.password) {
      // password mismatch. Return generic error for security.
      return { error: "Invalid username or password." };
    }

    // user successfully logged in
    return { user: userDoc._id };
  }
}
```