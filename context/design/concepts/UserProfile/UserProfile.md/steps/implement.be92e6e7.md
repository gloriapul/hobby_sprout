---
timestamp: 'Fri Oct 17 2025 00:05:27 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_000527.9a6761c4.md]]'
content_id: be92e6e72822949e6e9c9896a194d677b38425e7f51e6fc82db469a19c8d8092
---

# implement: UserProfile

existing concept - concept UserProfile \[User]
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
