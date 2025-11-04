/**
 * QuizMatchmaker Synchronizations
 *
 * Handles personality quiz and hobby matching.
 */

import { QuizMatchmaker, Requesting, Sessioning } from "@concepts";
import { actions, Frames, Sync } from "@engine";

//-- Quiz & Matching --//

export const GenerateHobbyMatchRequest: Sync = (
  { request, session, answers, user, hobby },
) => ({
  when: actions([
    Requesting.request,
    { path: "/QuizMatchmaker/generateHobbyMatch", session, answers },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([QuizMatchmaker.generateHobbyMatch, { user, answers }, {
    hobby,
  }]),
});

export const GenerateHobbyMatchResponse: Sync = ({ request, hobby }) => ({
  when: actions(
    [Requesting.request, { path: "/QuizMatchmaker/generateHobbyMatch" }, {
      request,
    }],
    [QuizMatchmaker.generateHobbyMatch, {}, { hobby }],
  ),
  then: actions([Requesting.respond, { request, hobby }]),
});

export const DeleteHobbyMatchesRequest: Sync = (
  { request, session, user, msg },
) => ({
  when: actions([
    Requesting.request,
    { path: "/QuizMatchmaker/deleteHobbyMatches", session },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([QuizMatchmaker.deleteHobbyMatches, { user }, { msg }]),
});

export const DeleteHobbyMatchesResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/QuizMatchmaker/deleteHobbyMatches" }, {
      request,
    }],
    [QuizMatchmaker.deleteHobbyMatches, {}, { msg }],
  ),
  then: actions([Requesting.respond, { request, msg }]),
});

//-- Query Syncs --//

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
