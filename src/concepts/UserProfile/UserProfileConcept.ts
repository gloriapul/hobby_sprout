
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
 * This is interpreted as a collection representing the relationship between a user and a specific hobby,
 * along with whether that hobby is currently active for that user.
 */
interface UserHobbyDoc {
  _id: ID; // Unique ID for this specific user-hobby relationship record
  userId: User; // The ID of the user
  hobby: string; // The name of the hobby (String as per spec)
  active: boolean; // True if the hobby is active for the user, false if closed
}

/**
 * concept UserProfile [User]
 * purpose allow users to share their personal info
 * principle after setting a name, hobby, and image for a user, other users can see them
 */
export default class UserProfileConcept {
  private userProfiles: Collection<UserProfileDoc>;
  private userHobbies: Collection<UserHobbyDoc>;

  // A preset list of available hobbies on the app is mentioned in the spec for 'setHobby'.
  // This concept does not manage that list itself, assuming it's an external constraint
  // or managed by another concept. The 'hobby' argument is treated as a string name.

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
   * and no initial display name or profile image. This action enables subsequent profile modifications.
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

  // --- Specified Actions ---

  /**
   * setName (user: User, displayname: String): Empty
   *
   * **requires** the user to exist in the set of users managed by this concept.
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
   * **requires** the user to exist in the set of users managed by this concept.
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
   *             (Implicitly, hobby should be part of a preset list of available hobbies, an external concern.)
   *
   * **effects** If the hobby does not exist for the user, it is added as active.
   *             If the hobby exists but is inactive, it is updated to active.
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
   * **requires** the user to exist in the set of users managed by this concept.
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

  // --- Concept Queries (for retrieving information, fulfilling the "principle" implicitly) ---

  /**
   * _getUserProfile (user: User): (profile: UserProfileDoc)
   *
   * **requires** user to exist in the set of users.
   *
   * **effects** returns the full profile data (active status, display name, profile image)
   *             for the specified user. Returns an array containing one profile document.
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
   * **requires** user to exist in the set of users.
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
   * **requires** user to exist in the set of users.
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