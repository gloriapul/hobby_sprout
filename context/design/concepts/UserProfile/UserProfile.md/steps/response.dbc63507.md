---
timestamp: 'Thu Nov 06 2025 17:36:13 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_173613.9a193fb5.md]]'
content_id: dbc63507f45e2ea77c50ad4c121b4777de75b1c7ab2da66951fac8bb7f7caec8
---

# response:

* **concept**: UserProfile \[User]
* **purpose**: allow users to share their personal info
* **principle**: after setting a name, hobby, and image for a user, other users can see them
* **state**:
  * A set of `Users` with
    * a `displayname` of type `String`
    * a `profile` of type `Image`
  * A set of `UserHobbies` with
    * a `userId` of type `User`
    * a `hobby` of type `String`
    * an `active` status of type `Boolean`
* **actions**:
  * `createProfile (user: User): ()`
    * **requires**: no profile for the given `user` already exists in this concept's state.
    * **effects**: creates a new user profile record for the given `user` with no initial display name or profile image. This action enables subsequent profile modifications.
  * `setName (user: User, displayname: String): ()`
    * **requires**: the user to exist in the set of users.
    * **effects**: sets the user's `displayname` to the provided `displayname`.
  * `setImage (user: User, image: Image): ()`
    * **requires**: the user to exist in the set of users.
    * **effects**: sets the user's `profile` image to the provided `image`.
  * `setHobby (user: User, hobby: String): ()`
    * **requires**: the user to exist in the set of `Users`.
      The `hobby` must not already be active for the specified `user`.
    * **effects**: If no `UserHobby` record exists for the given `user` and `hobby`, a new one is created and marked as `active`. If a `UserHobby` record exists but is `inactive`, it is updated to `active`.
  * `closeHobby (user: User, hobby: String): ()`
    * **requires**: the user to exist in the set of `Users`.
      A `UserHobby` record for the specified `user` and `hobby` must exist and be `active`.
    * **effects**: sets the `active` status of the specified `UserHobby` record to `false` (inactive).
  * `closeProfile (user: User): ()`
    * **requires**: the user to exist in the set of `Users`.
    * **effects**: permanently deletes the user's profile and all associated hobby records from the database.
  * `_getUserProfile (user: User): (UserProfileDoc[])`
    * **requires**: user to exist in the set of users.
    * **effects**: returns the full profile data for the specified user.
  * `_getUserHobbies (user: User): ({ hobby: string, active: boolean }[])`
    * **requires**: user to exist in the set of users.
    * **effects**: returns all hobbies associated with the specified user.
  * `_getActiveHobbies (user: User): ({ hobby: string, active: boolean }[])`
    * **requires**: user to exist in the set of users.
    * **effects**: returns all active hobbies for the specified user.
