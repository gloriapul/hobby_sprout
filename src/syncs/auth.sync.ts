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
import { $vars } from "../engine/vars.ts";

//-- User Login (Single Robust Sync) --//

export const Login: Sync = () => {
  const { request, username, password, user, session } = $vars;
  return {
    when: actions(
      [Requesting.request, {
        path: "/PasswordAuthentication/authenticate",
        username,
        password,
      }],
      [Requesting.request, { request }],
    ),
    then: actions(
      [PasswordAuthentication.authenticate, { username, password }],
      [Sessioning.start, { user }],
      [Requesting.respond, { request, msg: { user, session } }],
    ),
  };
};

//-- User Registration (Single Robust Sync) --//

export const Register: Sync = () => {
  const { request, username, password, user, session } = $vars;
  return {
    when: actions(
      [Requesting.request, {
        path: "/PasswordAuthentication/register",
        username,
        password,
      }],
      [Requesting.request, { request }],
    ),
    then: actions(
      [PasswordAuthentication.register, { username, password }],
      [UserProfile.createProfile, { user }],
      [Sessioning.start, { user }],
      [Requesting.respond, { request, msg: { user, session } }],
    ),
  };
};

// This sync chains the deletion of the user's authentication account after their profile is closed.
export const DeleteUserAfterProfileClosed: Sync = ({ user, request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/closeProfile" }, { request }],
    [UserProfile.closeProfile, { user }, {}],
  ),
  then: actions([PasswordAuthentication.deleteUser, { user }]),
});

//-- User Logout (Single Robust Sync) --//

export const Logout: Sync = () => {
  const { request, session } = $vars;
  return {
    when: actions(
      [Requesting.request, { path: "/logout", session }],
      [Requesting.request, { request }],
    ),
    then: actions(
      [Sessioning.end, { session }],
      [Requesting.respond, { request }],
    ),
  };
};
