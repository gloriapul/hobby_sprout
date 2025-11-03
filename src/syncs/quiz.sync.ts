/**
 * QuizMatchmaker Synchronizations
 *
 * Handles personality quiz and hobby matching.
 */

import { QuizMatchmaker, Requesting, Sessioning } from "@concepts";
import { actions, Sync } from "@engine";

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
  { request, session, user, match, matches },
) => ({
  when: actions([
    Requesting.request,
    { path: "/QuizMatchmaker/_getAllHobbyMatches", session },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(QuizMatchmaker._getAllHobbyMatches, { user }, {
      match,
    });
    return frames.collectAs([match], matches);
  },
  then: actions([Requesting.respond, { request, matches }]),
});

export const GetMatchedHobbyRequest: Sync = (
  { request, session, matchId, user, hobby, match },
) => ({
  when: actions([
    Requesting.request,
    { path: "/QuizMatchmaker/_getMatchedHobby", session, matchId },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(QuizMatchmaker._getMatchedHobby, { user }, {
      hobby,
    });
    return frames.collectAs([hobby], match);
  },
  then: actions([Requesting.respond, { request, match }]),
});
