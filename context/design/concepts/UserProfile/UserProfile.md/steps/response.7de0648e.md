---
timestamp: 'Fri Oct 17 2025 00:07:22 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_000722.2046a88d.md]]'
content_id: 7de0648e4c282d74190f89a34bed5ac8697c3b8f1debeaef82541e70a6edc045
---

# response:

Okay, let's format the `UserProfile` concept implementation to align perfectly with the `LabelingConcept.ts` example, ensuring all comments, type definitions, and action/query signatures follow the established pattern.

First, let's revisit the concept specification for `UserProfile`:

```concept
concept UserProfile [User]
purpose allow users to share their personal info
principle after setting a name, hobby, and image for a user, other users can see them
state
  set of User with
    an active status Boolean
    a displayname String
    a profile Image

  a set of Hobbies with
    an active status Boolean

actions
  setName (user: User, displayname: String)
    requires the user to exist in set of users
    effects sets the user's display name to the displayname they provide

  setImage (user: User, image: Image)
    requires the user to exist in set of users
    effects sets the user's profile image to the image they provide

  setHobby (user: User, hobby: String)
    requires the user to exist and for hobby to not already be active in set of hobbies, hobby must also be part of preset list of available hobbies on app
    effects adds the user's hobby that they entered or received as a result from a matching quiz to set of hobbies and marks it as active or just marks hobby from inactive to active if already in set

  closeHobby (user: User, hobby: String)
    requires the user to exist and for hobby to be active in set of hobbies
    effects sets the hobby to inactive

  closeProfile (user: User)
    requires user to exist in set of Users
    effects sets the user's account to inactive, which means closed
```

Now, here is the implementation following the requested format:

```typescript
// file: src/concepts/UserProfileConcept.ts

import { Collection, Db } from "mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "UserProfile.";

// Generic types of this concept
type User = ID;
type Image = string; // Assuming Image is a string (e.g., URL or base64 data)

/**
 * State:
 * a set of User with
 *   an active status Boolean
 *   a displayname String
 *   a profile Image
 *
 * This interface represents the main user profile document stored in MongoDB.
 * The `_id` field is explicitly typed as `User` to match the generic parameter.
 */
interface UserProfileDoc {
  _id: User; // The ID of the user, provided externally
  active: boolean; // True if the profile is active, false if closed
  displayname?: string; // Optional, as it might not be set initially
  profile?: Image; // Optional, as it might not be set initially
}

/**
 * State:
 * a set of Hobbies with
 *   an active status Boolean
 *
 * This interface represents a document linking a user to a specific hobby and its status.
 * A unique `_id` is generated for each user-hobby association.
 * `userId` links back to the `User` generic type.
 */
interface UserHobbyDoc {
  _id: ID; // Unique ID for this specific user-hobby relationship record
  userId: User; // The ID of the user this hobby belongs to
  hobby: string; // The name of the hobby (String as per spec)
  active: boolean; // True if the hobby is active for the user, false if closed
}

/**
 * concept UserProfile [User]
 * purpose allow users to share their personal info
 * principle after setting a name, hobby, and image for a user, other users can see them
 *
 * This concept manages user profiles, including display name, profile image,
 * and a list of active/inactive hobbies. It allows users to set and modify
 * these details, and to control the overall active status of their profile and individual hobbies.
 *
 * It implicitly assumes that the 'User' type is provided by an external
 * authentication or user management concept, and that user creation in that
 * external concept would trigger the creation of a profile here via synchronization.
 * For robustness, an explicit `createProfile` action is included for initialization.
 */
export default class UserProfileConcept {
  private userProfiles: Collection<UserProfileDoc>;
  private userHobbies: Collection<UserHobbyDoc>;

  constructor(private readonly db: Db) {
    this.userProfiles = this.db.collection(PREFIX + "userProfiles");
    this.userHobbies = this.db.collection(PREFIX + "userHobbies");
  }

  // --- Initializer Action (Assumed to be called by an integrating concept like UserAuthentication) ---

  /**
   * createProfile (user: User): Empty
   *
   * **requires** no profile for the given `user` already exists in this concept's state.
   *
   * **effects** creates a new user profile record for the given `user` with an `active` status of true,
   *             and no initial display name or profile image. This action enables subsequent profile modifications.
   */
  async createProfile({ user }: { user: User }): Promise<Empty | { error: string }> {
    const existingProfile = await this.userProfiles.findOne({ _id: user });
    if (existingProfile) {
      return { error: `Profile for user ${user} already exists.` };
    }

    await this.userProfiles.insertOne({
      _id: user,
      active: true, // Default to active upon creation
      displayname: undefined,
      profile: undefined,
    });
    return {};
  }

  // --- Actions ---

  /**
   * setName (user: User, displayname: String): Empty
   *
   * **requires** the user to exist in the set of users managed by this concept (i.e., a profile for `user` must exist).
   *
   * **effects** sets the user's display name to the `displayname` provided.
   */
  async setName({ user, displayname }: { user: User; displayname: string }): Promise<Empty | { error: string }> {
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
   * setImage (user: User, image: Image): Empty
   *
   * **requires** the user to exist in the set of users managed by this concept (i.e., a profile for `user` must exist).
   *
   * **effects** sets the user's profile image to the `image` (e.g., URL or base64 string) provided.
   */
  async setImage({ user, image }: { user: User; image: Image }): Promise<Empty | { error: string }> {
    const result = await this.userProfiles.updateOne(
      { _id: user },
      { $set: { profile: image } },
    );

    if (result.matchedCount === 0) {
      return { error: `User profile for ${user} not found.` };
    }
    return {};
  }

  /**
   * setHobby (user: User, hobby: String): Empty
   *
   * **requires** the user to exist in the set of users.
   *             The hobby must not already be active for the specified user.
   *             (Note: "hobby must also be part of preset list of available hobbies on app"
   *             is an external constraint not enforced by this concept directly,
   *             as this concept does not manage the master list of hobbies).
   *
   * **effects** If the hobby does not exist for the user, a new record is created and it is added as active.
   *             If the hobby exists but is currently inactive for the user, its status is updated to active.
   */
  async setHobby({ user, hobby }: { user: User; hobby: string }): Promise<Empty | { error: string }> {
    const userProfile = await this.userProfiles.findOne({ _id: user });
    if (!userProfile) {
      return { error: `User profile for ${user} not found.` };
    }

    // Attempt to find an existing user-hobby relationship
    const existingUserHobby = await this.userHobbies.findOne({ userId: user, hobby: hobby });

    if (existingUserHobby) {
      if (existingUserHobby.active) {
        // Requirement: "for hobby to not already be active"
        return { error: `Hobby '${hobby}' is already active for user ${user}.` };
      } else {
        // Effect: "marks hobby from inactive to active if already in set"
        await this.userHobbies.updateOne(
          { _id: existingUserHobby._id },
          { $set: { active: true } },
        );
      }
    } else {
      // Effect: "adds the user's hobby ... to set of hobbies and marks it as active"
      await this.userHobbies.insertOne({
        _id: freshID(), // Generate a unique ID for this new user-hobby record
        userId: user,
        hobby: hobby,
        active: true,
      });
    }

    return {};
  }

  /**
   * closeHobby (user: User, hobby: String): Empty
   *
   * **requires** the user to exist in the set of users.
   *             The specified `hobby` must be active for the user.
   *
   * **effects** sets the user's `hobby` to inactive.
   */
  async closeHobby({ user, hobby }: { user: User; hobby: string }): Promise<Empty | { error: string }> {
    const userProfile = await this.userProfiles.findOne({ _id: user });
    if (!userProfile) {
      return { error: `User profile for ${user} not found.` };
    }

    // Attempt to update the hobby to inactive, only if it's currently active
    const result = await this.userHobbies.updateOne(
      { userId: user, hobby: hobby, active: true },
      { $set: { active: false } },
    );

    if (result.matchedCount === 0) {
      // If no document was matched and updated, it means either:
      // 1. The hobby doesn't exist for the user.
      // 2. The hobby exists but is already inactive.
      const userHobby = await this.userHobbies.findOne({ userId: user, hobby: hobby });
      if (!userHobby) {
        return { error: `Hobby '${hobby}' not found for user ${user}.` };
      } else if (!userHobby.active) {
        return { error: `Hobby '${hobby}' is already inactive for user ${user}.` };
      }
      return { error: `Failed to close hobby '${hobby}' for user ${user} (unknown reason).` }; // Fallback
    }
    return {};
  }

  /**
   * closeProfile (user: User): Empty
   *
   * **requires** the user to exist in the set of users managed by this concept (i.e., a profile for `user` must exist).
   *
   * **effects** sets the user's account `active` status to false, indicating the profile is closed.
   */
  async closeProfile({ user }: { user: User }): Promise<Empty | { error: string }> {
    const result = await this.userProfiles.updateOne(
      { _id: user },
      { $set: { active: false } },
    );

    if (result.matchedCount === 0) {
      return { error: `User profile for ${user} not found.` };
    }
    return {};
  }

  // --- Queries ---

  /**
   * _getUserProfile (user: User): (profile: UserProfileDoc)
   *
   * **requires** a profile for the specified `user` to exist in the concept's state.
   *
   * **effects** returns the full profile data (active status, display name, profile image)
   *             for the specified user. Returns an array containing one profile document if found.
   */
  async _getUserProfile({ user }: { user: User }): Promise<UserProfileDoc[] | { error: string }> {
    const profile = await this.userProfiles.findOne({ _id: user });
    if (!profile) {
      return { error: `User profile for ${user} not found.` };
    }
    return [profile]; // Queries return an array of dictionaries
  }

  /**
   * _getUserHobbies (user: User): (hobby: { hobby: string, active: boolean })
   *
   * **requires** a profile for the specified `user` to exist in the concept's state.
   *
   * **effects** returns all hobbies associated with the specified user,
   *             including their name and active status. Returns an array of hobby dictionaries.
   */
  async _getUserHobbies({ user }: { user: User }): Promise<{ hobby: string, active: boolean }[] | { error: string }> {
    const userProfile = await this.userProfiles.findOne({ _id: user });
    if (!userProfile) {
      return { error: `User profile for ${user} not found.` };
    }
    const hobbies = await this.userHobbies.find({ userId: user }).toArray();
    // Map to the specified return structure
    return hobbies.map(doc => ({ hobby: doc.hobby, active: doc.active }));
  }

  /**
   * _getActiveHobbies (user: User): (hobby: string)
   *
   * **requires** a profile for the specified `user` to exist in the concept's state.
   *
   * **effects** returns only the names of all active hobbies for the specified user.
   *             Returns an array of dictionaries, each with a 'hobby' field.
   */
  async _getActiveHobbies({ user }: { user: User }): Promise<{ hobby: string }[] | { error: string }> {
    const userProfile = await this.userProfiles.findOne({ _id: user });
    if (!userProfile) {
      return { error: `User profile for ${user} not found.` };
    }
    const activeHobbies = await this.userHobbies.find({ userId: user, active: true }).toArray();
    // Map to the specified return structure
    return activeHobbies.map(doc => ({ hobby: doc.hobby }));
  }
}
```
