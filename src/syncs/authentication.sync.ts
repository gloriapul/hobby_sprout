/**
 * Authentication Synchronizations
 *
 * These syncs coordinate authentication and session management following the pattern
 * from the conceptbox repo implementation.
 */

import {
  MilestoneTracker,
  PasswordAuthentication,
  QuizMatchmaker,
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

//-- MilestoneTracker Authentication Syncs --//
// All MilestoneTracker actions require a valid session

export const CreateGoalRequest: Sync = (
  { request, session, hobby, title, deadline, user, goal },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/createGoal", session, hobby, title, deadline },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning.getUser, { session }, { user }),
  then: actions([
    MilestoneTracker.createGoal,
    { user, hobby, title, deadline },
    { goal },
  ]),
});

export const CreateGoalResponse: Sync = ({ request, goal }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/createGoal" }, { request }],
    [MilestoneTracker.createGoal, {}, { goal }],
  ),
  then: actions([Requesting.respond, { request, goal }]),
});

export const GenerateStepsRequest: Sync = (
  { request, session, goalId, user, steps },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/generateSteps", session, goalId },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning.getUser, { session }, { user }),
  then: actions([MilestoneTracker.generateSteps, { user, goalId }, { steps }]),
});

export const GenerateStepsResponse: Sync = ({ request, steps }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/generateSteps" }, {
      request,
    }],
    [MilestoneTracker.generateSteps, {}, { steps }],
  ),
  then: actions([Requesting.respond, { request, steps }]),
});

export const AddStepRequest: Sync = (
  { request, session, goalId, description, deadline, user, step },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/MilestoneTracker/addStep",
      session,
      goalId,
      description,
      deadline,
    },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning.getUser, { session }, { user }),
  then: actions([MilestoneTracker.addStep, {
    user,
    goalId,
    description,
    deadline,
  }, { step }]),
});

export const AddStepResponse: Sync = ({ request, step }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/addStep" }, { request }],
    [MilestoneTracker.addStep, {}, { step }],
  ),
  then: actions([Requesting.respond, { request, step }]),
});

export const CompleteStepRequest: Sync = (
  { request, session, stepId, user, msg },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/completeStep", session, stepId },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning.getUser, { session }, { user }),
  then: actions([MilestoneTracker.completeStep, { user, stepId }, { msg }]),
});

export const CompleteStepResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/completeStep" }, {
      request,
    }],
    [MilestoneTracker.completeStep, {}, { msg }],
  ),
  then: actions([Requesting.respond, { request, msg }]),
});

export const RemoveStepRequest: Sync = (
  { request, session, stepId, user, msg },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/removeStep", session, stepId },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning.getUser, { session }, { user }),
  then: actions([MilestoneTracker.removeStep, { user, stepId }, { msg }]),
});

export const RemoveStepResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/removeStep" }, { request }],
    [MilestoneTracker.removeStep, {}, { msg }],
  ),
  then: actions([Requesting.respond, { request, msg }]),
});

export const CloseGoalRequest: Sync = (
  { request, session, goalId, user, msg },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/closeGoal", session, goalId },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning.getUser, { session }, { user }),
  then: actions([MilestoneTracker.closeGoal, { user, goalId }, { msg }]),
});

export const CloseGoalResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/closeGoal" }, { request }],
    [MilestoneTracker.closeGoal, {}, { msg }],
  ),
  then: actions([Requesting.respond, { request, msg }]),
});

export const RegenerateStepsRequest: Sync = (
  { request, session, goalId, user, steps },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/regenerateSteps", session, goalId },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning.getUser, { session }, { user }),
  then: actions([MilestoneTracker.regenerateSteps, { user, goalId }, {
    steps,
  }]),
});

export const RegenerateStepsResponse: Sync = ({ request, steps }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/regenerateSteps" }, {
      request,
    }],
    [MilestoneTracker.regenerateSteps, {}, { steps }],
  ),
  then: actions([Requesting.respond, { request, steps }]),
});

export const GetGoalRequest: Sync = (
  { request, session, goalId, user, goal, goals },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/_getGoal", session, goalId },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning.getUser, { session }, { user });
    frames = await frames.query(MilestoneTracker._getGoal, { user, goalId }, {
      goal,
    });
    return frames.collectAs([goal], goals);
  },
  then: actions([Requesting.respond, { request, goals }]),
});

export const GetAllGoalsRequest: Sync = (
  { request, session, user, goal, goals },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/_getAllGoals", session },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning.getUser, { session }, { user });
    frames = await frames.query(MilestoneTracker._getAllGoals, { user }, {
      goal,
    });
    return frames.collectAs([goal], goals);
  },
  then: actions([Requesting.respond, { request, goals }]),
});

export const GetStepsRequest: Sync = (
  { request, session, goalId, user, step, steps },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/_getSteps", session, goalId },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning.getUser, { session }, { user });
    frames = await frames.query(MilestoneTracker._getSteps, { goal: goalId }, {
      step,
    });
    return frames.collectAs([step], steps);
  },
  then: actions([Requesting.respond, { request, steps }]),
});

export const GetIncompleteStepsRequest: Sync = (
  { request, session, goalId, user, step, steps },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/_getIncompleteSteps", session, goalId },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning.getUser, { session }, { user });
    frames = await frames.query(MilestoneTracker._getIncompleteSteps, {
      goal: goalId,
    }, { step });
    return frames.collectAs([step], steps);
  },
  then: actions([Requesting.respond, { request, steps }]),
});

export const GetCompleteStepsRequest: Sync = (
  { request, session, goalId, user, step, steps },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/_getCompleteSteps", session, goalId },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning.getUser, { session }, { user });
    frames = await frames.query(MilestoneTracker._getCompleteSteps, {
      goal: goalId,
    }, { step });
    return frames.collectAs([step], steps);
  },
  then: actions([Requesting.respond, { request, steps }]),
});

//-- UserProfile Authentication Syncs --//

export const CreateProfileRequest: Sync = (
  { request, session, displayname, profile, user, msg },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/createProfile", session, displayname, profile },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning.getUser, { session }, { user }),
  then: actions([UserProfile.createProfile, { user, displayname, profile }, {
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
    await frames.query(Sessioning.getUser, { session }, { user }),
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
    await frames.query(Sessioning.getUser, { session }, { user }),
  then: actions([UserProfile.setImage, { user, profile }, { msg }]),
});

export const SetImageResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/setImage" }, { request }],
    [UserProfile.setImage, {}, { msg }],
  ),
  then: actions([Requesting.respond, { request, msg }]),
});

export const SetHobbyRequest: Sync = (
  { request, session, hobby, user, msg },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/setHobby", session, hobby },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning.getUser, { session }, { user }),
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
    await frames.query(Sessioning.getUser, { session }, { user }),
  then: actions([UserProfile.closeHobby, { user, hobby }, { msg }]),
});

export const CloseHobbyResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/closeHobby" }, { request }],
    [UserProfile.closeHobby, {}, { msg }],
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
    await frames.query(Sessioning.getUser, { session }, { user }),
  then: actions([UserProfile.closeProfile, { user }, { msg }]),
});

export const CloseProfileResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/UserProfile/closeProfile" }, { request }],
    [UserProfile.closeProfile, {}, { msg }],
  ),
  then: actions([Requesting.respond, { request, msg }]),
});

export const GetUserProfileRequest: Sync = (
  { request, session, user, profile, userProfile },
) => ({
  when: actions([
    Requesting.request,
    { path: "/UserProfile/_getUserProfile", session },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning.getUser, { session }, { user });
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
    frames = await frames.query(Sessioning.getUser, { session }, { user });
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
    frames = await frames.query(Sessioning.getUser, { session }, { user });
    frames = await frames.query(UserProfile._getActiveHobbies, { user }, {
      hobby,
    });
    return frames.collectAs([hobby], hobbies);
  },
  then: actions([Requesting.respond, { request, hobbies }]),
});

//-- QuizMatchmaker Authentication Syncs --//

export const GenerateHobbyMatchRequest: Sync = (
  { request, session, answers, user, hobby },
) => ({
  when: actions([
    Requesting.request,
    { path: "/QuizMatchmaker/generateHobbyMatch", session, answers },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning.getUser, { session }, { user }),
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

export const GetAllHobbyMatchesRequest: Sync = (
  { request, session, user, match, matches },
) => ({
  when: actions([
    Requesting.request,
    { path: "/QuizMatchmaker/_getAllHobbyMatches", session },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning.getUser, { session }, { user });
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
    frames = await frames.query(Sessioning.getUser, { session }, { user });
    frames = await frames.query(QuizMatchmaker._getMatchedHobby, { user }, {
      hobby,
    });
    return frames.collectAs([hobby], match);
  },
  then: actions([Requesting.respond, { request, match }]),
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
    await frames.query(Sessioning.getUser, { session }, { user }),
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

//-- Delete User Authentication Sync --//

export const DeleteUserRequest: Sync = ({ request, session, user, msg }) => ({
  when: actions([
    Requesting.request,
    { path: "/PasswordAuthentication/deleteUser", session },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning.getUser, { session }, { user }),
  then: actions([PasswordAuthentication.deleteUser, { user }, { msg }]),
});

export const DeleteUserResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuthentication/deleteUser" }, {
      request,
    }],
    [PasswordAuthentication.deleteUser, {}, { msg }],
  ),
  then: actions([Requesting.respond, { request, msg }]),
});
