/**
 * Authentication & Registration Synchronizations
 *
 * Handles user login, registration, and session management.
 */

import {
  PasswordAuthentication,
  Requesting,
  Sessioning,
  UserProfile,
} from "@concepts";
import { actions, Sync } from "@engine";

//-- User Login & Session Creation --//

export const LoginRequest: Sync = ({ request, username, password }) => ({
  when: actions([
    Requesting.request,
    { path: "/PasswordAuthentication/authenticate", username, password },
    { request },
  ]),
  then: actions([PasswordAuthentication.authenticate, { username, password }]),
});

// When authentication succeeds, automatically create a session
export const LoginSuccessCreatesSession: Sync = ({ user }) => ({
  when: actions([PasswordAuthentication.authenticate, {}, { user }]),
  then: actions([Sessioning.start, { user }]),
});

export const LoginResponseSuccess: Sync = ({ request, user, session }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuthentication/authenticate" }, {
      request,
    }],
    [PasswordAuthentication.authenticate, {}, { user }],
    [Sessioning.start, { user }, { session }],
  ),
  then: actions([Requesting.respond, { request, user, session }]),
});

export const LoginResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuthentication/authenticate" }, {
      request,
    }],
    [PasswordAuthentication.authenticate, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

//-- User Registration (Public Endpoint) --//

export const RegisterRequest: Sync = ({ request, username, password }) => ({
  when: actions([
    Requesting.request,
    { path: "/PasswordAuthentication/register", username, password },
    { request },
  ]),
  then: actions([PasswordAuthentication.register, { username, password }]),
});

export const RegisterResponseSuccess: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuthentication/register" }, {
      request,
    }],
    [PasswordAuthentication.register, {}, { user }],
  ),
  then: actions([Requesting.respond, { request, user }]),
});

export const RegisterResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuthentication/register" }, {
      request,
    }],
    [PasswordAuthentication.register, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const DeleteUserRequest: Sync = ({ request, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/PasswordAuthentication/deleteUser", session },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([PasswordAuthentication.deleteUser, { user }]),
});

// This sync sends a success response to the frontend after the user's authentication account is deleted.
export const DeleteUserResponse: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/closeProfile" }, { request }],
    [UserProfile.closeProfile, { user }, {}],
    [PasswordAuthentication.deleteUser, { user }, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

// This sync sends an error response to the frontend if the user's authentication account deletion fails.
export const DeleteUserErrorResponse: Sync = ({ request, user, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/closeProfile" }, { request }],
    [UserProfile.closeProfile, { user }, {}],
    [PasswordAuthentication.deleteUser, { user }, { error }],
  ),
  then: actions([Requesting.respond, { request, msg: { error } }]),
});

// Automatically create a user profile after successful registration
export const CreateProfileAfterRegister: Sync = ({ user }) => ({
  when: actions([PasswordAuthentication.register, {}, { user }]),
  then: actions([UserProfile.createProfile, { user }]),
});

// This sync chains the deletion of the user's authentication account after their profile is closed.
export const DeleteUserAfterProfileClosed: Sync = ({ user, request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/closeProfile" }, { request }],
    [UserProfile.closeProfile, { user }, {}],
  ),
  then: actions([PasswordAuthentication.deleteUser, { user }]),
});
