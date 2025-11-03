/**
 * UserProfile Synchronizations
 *
 * Handles user profile and hobby management.
 */

import { Requesting, Sessioning, UserProfile } from "@concepts";
import { actions, Sync } from "@engine";

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
  then: actions([UserProfile.createProfile, { user }, {
    msg,
  }]),
});

export const CreateProfileResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/createProfile" }, { request }],
    [UserProfile.createProfile, {}, { msg }],
  ),
  then: actions([Requesting.respond, { request, msg }]),
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

export const SetNameResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setName" }, { request }],
    [UserProfile.setName, {}, { msg }],
  ),
  then: actions([Requesting.respond, { request, msg }]),
});

export const SetImageRequest: Sync = (
  { request, session, profile, user, msg },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/setImage", session, profile },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([UserProfile.setImage, { user, profile }, { msg }]),
});

export const SetImageResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setImage" }, { request }],
    [UserProfile.setImage, {}, { msg }],
  ),
  then: actions([Requesting.respond, { request, msg }]),
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

export const CloseProfileResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/closeProfile" }, { request }],
    [UserProfile.closeProfile, {}, { msg }],
  ),
  then: actions([Requesting.respond, { request, msg }]),
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

export const SetHobbyResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setHobby" }, { request }],
    [UserProfile.setHobby, {}, { msg }],
  ),
  then: actions([Requesting.respond, { request, msg }]),
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

export const CloseHobbyResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/closeHobby" }, { request }],
    [UserProfile.closeHobby, {}, { msg }],
  ),
  then: actions([Requesting.respond, { request, msg }]),
});

//-- Query Syncs --//

export const GetUserProfileRequest: Sync = (
  { request, session, user, profile, userProfile },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/_getUserProfile", session },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(UserProfile._getUserProfile, { user }, {
      profile,
    });
    return frames.collectAs([profile], userProfile);
  },
  then: actions([Requesting.respond, { request, userProfile }]),
});

export const GetUserHobbiesRequest: Sync = (
  { request, session, user, hobby, hobbies },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/_getUserHobbies", session },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(UserProfile._getUserHobbies, { user }, {
      hobby,
    });
    return frames.collectAs([hobby], hobbies);
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
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(UserProfile._getActiveHobbies, { user }, {
      hobby,
    });
    return frames.collectAs([hobby], hobbies);
  },
  then: actions([Requesting.respond, { request, hobbies }]),
});
