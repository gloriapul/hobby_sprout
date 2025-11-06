/**
 * UserProfile Synchronizations
 *
 * Handles user profile and hobby management.
 */

import { Requesting, Sessioning, UserProfile } from "@concepts";
import { actions, Frames, Sync } from "@engine";

//-- Profile Management --//

/** Handles a request to create a user profile. */
export const CreateProfileRequest: Sync = (
  { request, session, user, msg },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/createProfile", session },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([UserProfile.createProfile, { user }, { msg }]),
});

/** Responds on successful profile creation. */
export const CreateProfileResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/createProfile" }, { request }],
    [UserProfile.createProfile, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

/** Responds with an error if profile creation fails. */
export const CreateProfileResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/createProfile" }, { request }],
    [UserProfile.createProfile, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, msg: { error } }]),
});

/** Handles a request to set a user's display name. */
export const SetNameRequest: Sync = (
  { request, session, displayname, user, msg },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/setName", session, displayname },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([UserProfile.setName, { user, displayname }, { msg }]),
});

/** Responds on successful name change. */
export const SetNameResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setName" }, { request }],
    [UserProfile.setName, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

/** Responds with an error if name change fails. */
export const SetNameResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setName" }, { request }],
    [UserProfile.setName, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, msg: { error } }]),
});

/** Handles a request to set a user's profile image. */
export const SetImageRequest: Sync = (
  { request, session, image, user, msg },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/setImage", session, image },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([UserProfile.setImage, { user, image }, { msg }]),
});

/** Responds on successful image change. */
export const SetImageResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setImage" }, { request }],
    [UserProfile.setImage, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

/** Responds with an error if image change fails. */
export const SetImageResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setImage" }, { request }],
    [UserProfile.setImage, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, msg: { error } }]),
});

/** Handles a request to close a user's profile. */
export const CloseProfileRequest: Sync = ({ request, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/closeProfile", session },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([UserProfile.closeProfile, { user }]),
});

//-- Hobby Management --//

/** Handles a request to set an active hobby for a user. */
export const SetHobbyRequest: Sync = (
  { request, session, hobby, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/setHobby", session, hobby },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([UserProfile.setHobby, { user, hobby }]),
});

/** Responds on successful hobby activation. */
export const SetHobbyResponse: Sync = ({ request, user, hobby }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setHobby", hobby }, { request }],
    [UserProfile.setHobby, { user, hobby }, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

/** Responds with an error if hobby activation fails. */
export const SetHobbyResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setHobby" }, { request }],
    [UserProfile.setHobby, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, msg: { error } }]),
});

/** Handles a request to deactivate a hobby for a user. */
export const CloseHobbyRequest: Sync = (
  { request, session, hobby, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/closeHobby", session, hobby },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([UserProfile.closeHobby, { user, hobby }]),
});

/** Responds on successful hobby deactivation. */
export const CloseHobbyResponse: Sync = ({ request, user, hobby }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/closeHobby", hobby }, {
      request,
    }],
    [UserProfile.closeHobby, { user, hobby }, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

/** Responds with an error if hobby deactivation fails. */
export const CloseHobbyResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/closeHobby" }, { request }],
    [UserProfile.closeHobby, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, msg: { error } }]),
});

//-- Query Syncs --//

/** Handles a request to get a user's profile. */
export const GetUserProfileRequest: Sync = (
  { request, session, user, userProfile },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/_getUserProfile", session },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(
      UserProfile._getUserProfile,
      { user },
      { userProfile },
    );
    // Wrap userProfile in an array for the response
    return frames.map(($) => ({ ...$, [userProfile]: [$[userProfile]] }));
  },
  then: actions([Requesting.respond, { request, userProfile }]),
});

/** Handles a request to get all of a user's hobbies. */
export const GetUserHobbiesRequest: Sync = (
  { request, session, user, hobby, active, hobbies },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/_getUserHobbies", session },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(
      UserProfile._getUserHobbies,
      { user },
      { hobby, active },
    );
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [hobbies]: [] });
    }
    return frames.collectAs([hobby, active], hobbies);
  },
  then: actions([Requesting.respond, { request, hobbies }]),
});

/** Handles a request to get a user's active hobbies. */
export const GetActiveHobbiesRequest: Sync = (
  { request, session, user, hobby, active, hobbies },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/_getActiveHobbies", session },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(
      UserProfile._getActiveHobbies,
      { user },
      { hobby, active },
    );
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [hobbies]: [] });
    }
    return frames.collectAs([hobby, active], hobbies);
  },
  then: actions([Requesting.respond, { request, hobbies }]),
});
