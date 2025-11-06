/**
 * QuizMatchmaker Synchronizations
 *
 * Handles personality quiz and hobby matching.
 */

import { QuizMatchmaker, Requesting, Sessioning } from "@concepts";
import { actions, Frames, Sync } from "@engine";

//-- Quiz & Matching --//

/** Handles a request to generate a hobby match from quiz answers. */
export const GenerateHobbyMatchRequest: Sync = (
  { request, session, answers, user, matchedHobby },
) => ({
  when: actions([
    Requesting.request,
    { path: "/QuizMatchmaker/generateHobbyMatch", session, answers },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([QuizMatchmaker.generateHobbyMatch, { user, answers }, {
    matchedHobby,
  }]),
});

/** Responds with the generated hobby match. */
export const GenerateHobbyMatchResponse: Sync = (
  { request, matchedHobby },
) => ({
  when: actions(
    [Requesting.request, { path: "/QuizMatchmaker/generateHobbyMatch" }, {
      request,
    }],
    [QuizMatchmaker.generateHobbyMatch, {}, { matchedHobby }],
  ),
  then: actions([Requesting.respond, { request, matchedHobby }]),
});

/** Responds with an error if hobby match generation fails. */
export const GenerateHobbyMatchResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/QuizMatchmaker/generateHobbyMatch" }, {
      request,
    }],
    [QuizMatchmaker.generateHobbyMatch, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/** Handles a request to delete all hobby matches for a user. */
export const DeleteHobbyMatchesRequest: Sync = (
  { request, session, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/QuizMatchmaker/deleteHobbyMatches", session },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([QuizMatchmaker.deleteHobbyMatches, { user }]),
});

/** Responds on successful deletion of hobby matches. */
export const DeleteHobbyMatchesResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/QuizMatchmaker/deleteHobbyMatches" }, {
      request,
    }],
    [QuizMatchmaker.deleteHobbyMatches, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

/** Responds with an error if deletion of hobby matches fails. */
export const DeleteHobbyMatchesResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/QuizMatchmaker/deleteHobbyMatches" }, {
      request,
    }],
    [QuizMatchmaker.deleteHobbyMatches, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

//-- Query Syncs --//

/** Handles a request to get all hobby matches for a user. */
export const GetAllHobbyMatchesRequest: Sync = (
  { request, session, user, id, hobby, matchedAt, matches },
) => ({
  when: actions([
    Requesting.request,
    { path: "/QuizMatchmaker/_getAllHobbyMatches", session },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(QuizMatchmaker._getAllHobbyMatches, { user }, {
      id,
      hobby,
      matchedAt,
    });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [matches]: [] });
    }
    return frames.collectAs([id, hobby, matchedAt], matches);
  },
  then: actions([Requesting.respond, { request, matches }]),
});
