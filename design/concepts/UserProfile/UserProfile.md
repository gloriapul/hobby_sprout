[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

# implement: UserProfile 

# response:

*   **concept**: UserProfile \[User]
*   **purpose**: allow users to share their personal info
*   **principle**: after setting a name, hobby, and image for a user, other users can see them
*   **state**:
    *   A set of `Users` with
        *   a `displayname` of type `String`
        *   a `profile` of type `Image`
    *   A set of `UserHobbies` with
        *   a `userId` of type `User`
        *   a `hobby` of type `String`
        *   an `active` status of type `Boolean`
*   **actions**:
    *   `createProfile (user: User): ()`
        *   **requires**: no profile for the given `user` already exists in this concept's state.
        *   **effects**: creates a new user profile record for the given `user` with no initial display name or profile image. This action enables subsequent profile modifications.
    *   `setName (user: User, displayname: String): ()`
        *   **requires**: the user to exist in the set of users.
        *   **effects**: sets the user's `displayname` to the provided `displayname`.
    *   `setImage (user: User, image: Image): ()`
        *   **requires**: the user to exist in the set of users.
        *   **effects**: sets the user's `profile` image to the provided `image`.
    *   `setHobby (user: User, hobby: String): ()`
        *   **requires**: the user to exist in the set of `Users`.
            The `hobby` must not already be active for the specified `user`.
        *   **effects**: If no `UserHobby` record exists for the given `user` and `hobby`, a new one is created and marked as `active`. If a `UserHobby` record exists but is `inactive`, it is updated to `active`.
    *   `closeHobby (user: User, hobby: String): ()`
        *   **requires**: the user to exist in the set of `Users`.
            A `UserHobby` record for the specified `user` and `hobby` must exist and be `active`.
        *   **effects**: sets the `active` status of the specified `UserHobby` record to `false` (inactive).
  *   `closeProfile (user: User): ()`
    *   **requires**: the user to exist in the set of `Users`.
    *   **effects**: permanently deletes the user's profile, all associated hobby records, the user's authentication record (username/password), and all active sessions/tokens for that user from the database. After this, the user cannot log in again with the same credentials.
    *   `_getUserProfile (user: User): (UserProfileDoc[])`
        *   **requires**: user to exist in the set of users.
        *   **effects**: returns the full profile data for the specified user.
    *   `_getUserHobbies (user: User): ({ hobby: string, active: boolean }[])`
        *   **requires**: user to exist in the set of users.
        *   **effects**: returns all hobbies associated with the specified user.
    *   `_getActiveHobbies (user: User): ({ hobby: string, active: boolean }[])`
        *   **requires**: user to exist in the set of users.
        *   **effects**: returns all active hobbies for the specified user.

# file: src/concepts/UserProfileConcept.ts

# final

```typescript
import { Collection, Db } from "mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "UserProfile.";

// Generic types for this concept
type User = ID;
type Image = string; // Assuming Image will be a string (e.g., URL or base64 data), a user can use a link to an image address

/**
 * State:
 * a set of User with
 *   a displayname String
 *   a profile Image
 */
interface UserProfileDoc {
  _id: User;
  displayname?: string; // Optional, as it might not be set initially
  profile?: Image; // Optional, as it might not be set initially
}

/**
 * State:
 * a set of Hobbies with
 *   an active status Boolean
 *
 * A collection representing the relationship between a user and a specific hobby,
 * along with whether that hobby is currently active for that user.
 */
interface UserHobbyDoc {
  _id: ID; // Unique ID for this specific user-hobby relationship record
  userId: User; // The ID of the user
  hobby: string;
  active: boolean;
}

/**
 * @concept UserProfile
 * @purpose allow users to share their personal info
 * @principle after setting a name, hobby, and image for a user, other users can see them
 */
export default class UserProfileConcept {
  private userProfiles: Collection<UserProfileDoc>;
  private userHobbies: Collection<UserHobbyDoc>;

  // Users can pursue any hobby of their choice without restrictions.

  constructor(private readonly db: Db) {
    this.userProfiles = this.db.collection(PREFIX + "userProfiles");
    this.userHobbies = this.db.collection(PREFIX + "userHobbies");
  }

  /**
   * createProfile (user: User)
   *
   * @requires no profile for the given `user` already exists in this concept's state.
   *
   * @effects creates a new user profile record for the given `user` with no initial display name
   * or profile image. This action enables subsequent profile modifications.
   */
  async createProfile(
    // passwordauthentication concept would be paired with this concept in a sync
    // but since not implementing syncs yet as specified, then not included
    { user }: { user: User },
  ): Promise<Empty | { error: string }> {
    const existingProfile = await this.userProfiles.findOne({ _id: user });
    if (existingProfile) {
      return { error: `Profile for user ${user} already exists.` };
    }

    await this.userProfiles.insertOne({
      _id: user,
      displayname: undefined,
      profile: undefined,
    });
    return {};
  }

  /**
   * setName (user: User, displayname: String)
   *
   * @requires the user to exist in the set of users managed by this concept.
   *
   * @effects sets the user's display name to the `displayname` provided.
   */
  async setName(
    { user, displayname }: { user: User; displayname: string },
  ): Promise<Empty | { error: string }> {
    const result = await this.userProfiles.updateOne(
      { _id: user },
      { $set: { displayname: displayname } },
    );

    if (result.matchedCount === 0) {
      return { error: `User profile for ${user} not found.` };
    }
    return {};
  }

  /**
   * setImage (user: User, image: Image)
   *
   * @requires the user to exist in the set of users managed by this concept.
   *
   * @effects sets the user's profile image to the `image` (e.g., URL or base64 string) provided, like an image address
   */
  async setImage(
    { user, image }: { user: User; image: Image },
  ): Promise<Empty | { error: string }> {
    const result = await this.userProfiles.updateOne(
      { _id: user },
      { $set: { profile: image } },
    );

    if (result.matchedCount === 0) {
      return { error: `User profile for ${user} not found.` };
    }
    return {};
    // image address link since a user can just set their profile image to link of image of their hobby that they can find online
    // no reason for a user to upload their own image since now that communities is not being implemented, they do not need or want to show their face necessarily
  }

  /**
   * setHobby (user: User, hobby: String)
   *
   * @requires the user to exist in the set of users.
   *             The hobby must not already be active for the specified user.
   *
   * @effects if the hobby does not exist for the user, it is added as active.
   *             If the hobby exists but is inactive, it is updated to active.
   */
  async setHobby(
    { user, hobby }: { user: User; hobby: string },
  ): Promise<Empty | { error: string }> {
    const userProfile = await this.userProfiles.findOne({ _id: user });
    if (!userProfile) {
      return { error: `User profile for ${user} not found.` };
    }

    // attempt to find an existing user-hobby relationship
    const existingUserHobby = await this.userHobbies.findOne({
      userId: user,
      hobby: hobby,
    });

    if (existingUserHobby) {
      if (existingUserHobby.active) {
        // hobby cannot be added again if already active
        return {
          error: `Hobby '${hobby}' is already active for user ${user}.`,
        };
      } else {
        await this.userHobbies.updateOne(
          { _id: existingUserHobby._id },
          { $set: { active: true } },
        );
      }
    } else {
      // success in adding hobby as new active hobby
      await this.userHobbies.insertOne({
        _id: freshID(), // generate a unique ID for this new user-hobby record
        userId: user,
        hobby: hobby,
        active: true,
      });
    }

    return {};
  }

  /**
   * closeHobby (user: User, hobby: String)
   *
   * @requires the user to exist in the set of users.
   *             The specified `hobby` must be active for the user.
   *
   * @effects sets the user's `hobby` to inactive.
   */
  async closeHobby(
    { user, hobby }: { user: User; hobby: string },
  ): Promise<Empty | { error: string }> {
    const userProfile = await this.userProfiles.findOne({ _id: user });
    if (!userProfile) {
      return { error: `User profile for ${user} not found.` };
    }

    // attempt to update the hobby to inactive, only if it's currently active
    const result = await this.userHobbies.updateOne(
      { userId: user, hobby: hobby, active: true },
      { $set: { active: false } },
    );

    if (result.matchedCount === 0) {
      // If no document was matched and updated, it means either:
      // 1. The hobby doesn't exist for the user.
      // 2. The hobby exists but is already inactive.
      const userHobby = await this.userHobbies.findOne({
        userId: user,
        hobby: hobby,
      });
      if (!userHobby) {
        return { error: `Hobby '${hobby}' not found for user ${user}.` };
      } else if (!userHobby.active) {
        return {
          error: `Hobby '${hobby}' is already inactive for user ${user}.`,
        };
      }
      return {
        error: `Failed to close hobby '${hobby}' for user ${user}.`,
      };
    }
    return {};
  }

  /**
   * closeProfile (user: User)
   *
   * @requires the user to exist in the set of users managed by this concept.
   *
   * @effects permanently deletes the user's profile and all associated hobby records from the database.
   */
  async closeProfile(
    { user }: { user: User },
  ): Promise<Empty | { error: string }> {
    console.log("[CLOSE_PROFILE] Start for user:", user);
    const profile = await this.userProfiles.findOne({ _id: user });
    if (!profile) {
      return { error: `User profile for ${user} not found.` };
    }

    // Delete all hobbies for this user
    await this.userHobbies.deleteMany({ userId: user });

    // Delete the user profile
    const result = await this.userProfiles.deleteOne({ _id: user });
    if (result.deletedCount === 0) {
      return { error: `Failed to delete profile for user ${user}.` };
    }

    // Delete the user's authentication record
    try {
      // Dynamically import PasswordAuthenticationConcept
      const { default: PasswordAuthenticationConcept } = await import(
        "../PasswordAuthentication/PasswordAuthenticationConcept.ts"
      );
      const authConcept = new PasswordAuthenticationConcept(this.db);
      await authConcept.deleteUser({ user });
    } catch (e) {
      console.error("[CLOSE_PROFILE] Failed to delete auth record:", e);
      // Optionally, return error or continue
    }

    // Delete all sessions for this user
    try {
      const { default: SessioningConcept } = await import(
        "../Sessioning/SessioningConcept.ts"
      );
      const sessioning = new SessioningConcept(this.db);
      await sessioning["sessions"].deleteMany({ user });
    } catch (e) {
      console.error("[CLOSE_PROFILE] Failed to delete sessions:", e);
      // Optionally, return error or continue
    }

    return {};
  }

  /**
   * _getUserProfile (user: User): (userProfile: UserProfileDoc)
   *
   * @requires user to exist in the set of users.
   *
   * @effects returns the full profile data (display name, profile image)
   *             for the specified user. Returns an array with objects containing userProfile property.
   */
  async _getUserProfile(
    { user }: { user: User },
  ): Promise<{ userProfile: UserProfileDoc }[]> {
    const profile = await this.userProfiles.findOne({ _id: user });
    if (!profile) {
      return [];
    }
    return [{ userProfile: profile }];
  }

  /**
   * _getUserHobbies (user: User): (hobby: { hobby: string, active: boolean })
   *
   * @requires user to exist in the set of users.
   *
   * @effects returns all hobbies associated with the specified user,
   *             including their name and active status. Returns an array of hobby dictionaries.
   */
  async _getUserHobbies(
    { user }: { user: User },
  ): Promise<{ hobby: string; active: boolean }[]> {
    const userProfile = await this.userProfiles.findOne({ _id: user });
    if (!userProfile) {
      return [];
    }
    const hobbies = await this.userHobbies.find({ userId: user }).toArray();
    // map to the specified return structure
    return hobbies.map((doc) => ({ hobby: doc.hobby, active: doc.active }));
  }

  /**
   * _getActiveHobbies (user: User): (hobby: string, active: boolean)
   *
   * @requires user to exist in the set of users.
   *
   * @effects returns only the names of all active hobbies for the specified user.
   *             Returns an array of dictionaries, each with a 'hobby' and 'active' field.
   */
  async _getActiveHobbies(
    { user }: { user: User },
  ): Promise<{ hobby: string; active: boolean }[]> {
    const userProfile = await this.userProfiles.findOne({ _id: user });
    if (!userProfile) {
      return [];
    }
    const activeHobbies = await this.userHobbies.find({
      userId: user,
      active: true,
    }).toArray();
    // map to the specified return structure with active field
    return activeHobbies.map((doc) => ({
      hobby: doc.hobby,
      active: doc.active,
    }));
  }
}
```