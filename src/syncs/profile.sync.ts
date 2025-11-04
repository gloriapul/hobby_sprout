/**
 * UserProfile Synchronizations
 *
 * Handles user profile and hobby management.
 */

import { Requesting, Sessioning, UserProfile } from "@concepts";
import { actions, Frames, Sync } from "@engine";

//-- Profile Management --//

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

export const CreateProfileResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/createProfile" }, { request }],
    [UserProfile.createProfile, {}, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

export const CreateProfileResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/createProfile" }, { request }],
    [UserProfile.createProfile, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, msg: { error } }]),
});

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

export const SetNameResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setName" }, { request }],
    [UserProfile.setName, {}, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

export const SetNameResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setName" }, { request }],
    [UserProfile.setName, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, msg: { error } }]),
});

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

export const SetImageResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setImage" }, { request }],
    [UserProfile.setImage, {}, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

export const SetImageResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setImage" }, { request }],
    [UserProfile.setImage, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, msg: { error } }]),
});

export const CloseProfileRequest: Sync = ({ request, session, user, msg }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/closeProfile", session },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([UserProfile.closeProfile, { user }, { msg }]),
});

export const CloseProfileResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/closeProfile" }, { request }],
    [UserProfile.closeProfile, {}, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

export const CloseProfileResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/closeProfile" }, { request }],
    [UserProfile.closeProfile, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, msg: { error } }]),
});

//-- Hobby Management --//

export const SetHobbyRequest: Sync = (
  { request, session, hobby, user, msg },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/setHobby", session, hobby },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([UserProfile.setHobby, { user, hobby }, { msg }]),
});

export const SetHobbyResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setHobby" }, { request }],
    [UserProfile.setHobby, {}, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

export const SetHobbyResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setHobby" }, { request }],
    [UserProfile.setHobby, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, msg: { error } }]),
});

export const CloseHobbyRequest: Sync = (
  { request, session, hobby, user, msg },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/closeHobby", session, hobby },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([UserProfile.closeHobby, { user, hobby }, { msg }]),
});

export const CloseHobbyResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/closeHobby" }, { request }],
    [UserProfile.closeHobby, {}, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

export const CloseHobbyResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/closeHobby" }, { request }],
    [UserProfile.closeHobby, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, msg: { error } }]),
});

//-- Query Syncs --//

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

export const GetActiveHobbiesRequest: Sync = (
  { request, session, user, hobby, hobbies },
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
      { hobby },
    );
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [hobbies]: [] });
    }
    return frames.collectAs([hobby], hobbies);
  },
  then: actions([Requesting.respond, { request, hobbies }]),
});
