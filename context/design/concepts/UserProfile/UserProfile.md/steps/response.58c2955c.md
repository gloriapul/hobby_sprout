---
timestamp: 'Fri Oct 17 2025 00:08:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_000808.bfc108f9.md]]'
content_id: 58c2955c69697eee9d6bf8e0bac23e1283dac6689c4995beb8710f6f3b9cbcc4
---

# response:

Here is the `UserProfile` concept in the requested format:

* **concept**: UserProfile \[User]
* **purpose**: allow users to share their personal info
* **principle**: after setting a name, hobby, and image for a user, other users can see them
* **state**:
  * A set of `Users` with
    * an `active` status of type `Boolean`
    * a `displayname` of type `String`
    * a `profile` of type `Image`
  * A set of `UserHobbies` with
    * a `user` of type `User`
    * a `hobby` of type `String`
    * an `active` status of type `Boolean`
* **actions**:
  * `setName (user: User, displayname: String): ()`
    * **requires**: the user to exist in the set of users.
    * **effects**: sets the user's `displayname` to the provided `displayname`.
  * `setImage (user: User, image: Image): ()`
    * **requires**: the user to exist in the set of users.
    * **effects**: sets the user's `profile` image to the provided `image`.
  * `setHobby (user: User, hobby: String): ()`
    * **requires**: the user to exist in the set of `Users`.
      The `hobby` must not already be active for the specified `user`.
      (Implicitly, the `hobby` must also be part of a preset list of available hobbies on the app).
    * **effects**: If no `UserHobby` record exists for the given `user` and `hobby`, a new one is created and marked as `active`. If a `UserHobby` record exists but is `inactive`, it is updated to `active`.
  * `closeHobby (user: User, hobby: String): ()`
    * **requires**: the user to exist in the set of `Users`.
      A `UserHobby` record for the specified `user` and `hobby` must exist and be `active`.
    * **effects**: sets the `active` status of the specified `UserHobby` record to `false` (inactive).
  * `closeProfile (user: User): ()`
    * **requires**: the user to exist in the set of `Users`.
    * **effects**: sets the `active` status of the user's profile to `false`, indicating the profile is closed.
