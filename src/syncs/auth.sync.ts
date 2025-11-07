//-- Registration: Create Session after Register --//
export const RegisterSuccessCreatesSession: Sync = ({ user }) => ({
  when: actions([PasswordAuthentication.register, {}, { user }]),
  then: actions([Sessioning.start, { user }]),
});
import { actions, Sync } from "@engine";
import { PasswordAuthentication, Requesting, Sessioning } from "@concepts";

//-- User Registration --//
export const RegisterRequest: Sync = ({ request, username, password }) => ({
  // Debug log for registration request
  ...(console.log("[RegisterRequest] called with", { username, password }), {}),
  when: actions([Requesting.request, {
    path: "/PasswordAuthentication/register",
    username,
    password,
  }, { request }]),
  then: actions([PasswordAuthentication.register, { username, password }]),
});

export const RegisterResponseSuccess: Sync = ({ request, user, session }) => ({
  // Debug log for registration response
  ...(console.log("[RegisterResponseSuccess] user:", user, "session:", session),
    {}),
  when: actions(
    [Requesting.request, { path: "/PasswordAuthentication/register" }, {
      request,
    }],
    [PasswordAuthentication.register, {}, { user }],
    [Sessioning.start, { user }, { session }],
  ),
  then: actions([Requesting.respond, { request, user, session }]),
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

//-- User Login & Session Creation --//
export const LoginRequest: Sync = ({ request, username, password }) => ({
  // Debug log for login request
  ...(console.log("[LoginRequest] called with", { username, password }), {}),
  when: actions([Requesting.request, {
    path: "/PasswordAuthentication/authenticate",
    username,
    password,
  }, { request }]),
  then: actions([PasswordAuthentication.authenticate, { username, password }]),
});

export const LoginSuccessCreatesSession: Sync = ({ user }) => ({
  when: actions([PasswordAuthentication.authenticate, {}, { user }]),
  then: actions([Sessioning.start, { user }]),
});

export const LoginResponseSuccess: Sync = ({ request, user, session }) => ({
  // Debug log for login response
  ...(console.log("[LoginResponseSuccess] user:", user, "session:", session),
    {}),
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

//-- User Logout --//
export const LogoutRequest: Sync = ({ request, session, user }) => ({
  when: actions([Requesting.request, { path: "/logout", session }, {
    request,
  }]),
  where: (frames) => frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Sessioning.end, { session }]),
});

export const LogoutResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/logout" }, { request }],
    [Sessioning.end, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "logged_out" }]),
});
