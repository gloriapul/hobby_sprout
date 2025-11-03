/**
 * MilestoneTracker Synchronizations
 *
 * Handles goal and step management for milestone tracking.
 */

import { MilestoneTracker, Requesting, Sessioning } from "@concepts";
import { actions, Sync } from "@engine";

//-- Goal Management --//

export const CreateGoalRequest: Sync = (
  { request, session, hobby, description, user, goal },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/createGoal", session, hobby, description },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([
    MilestoneTracker.createGoal,
    { user, hobby, description },
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

export const CloseGoalRequest: Sync = (
  { request, session, goalId, user, msg },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/closeGoal", session, goalId },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([MilestoneTracker.closeGoal, { user, goalId }, { msg }]),
});

export const CloseGoalResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/closeGoal" }, { request }],
    [MilestoneTracker.closeGoal, {}, { msg }],
  ),
  then: actions([Requesting.respond, { request, msg }]),
});

//-- Step Management --//

export const GenerateStepsRequest: Sync = (
  { request, session, goalId, user, steps },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/generateSteps", session, goalId },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
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

export const RegenerateStepsRequest: Sync = (
  { request, session, goalId, user, steps },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/regenerateSteps", session, goalId },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
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

export const AddStepRequest: Sync = (
  { request, session, goalId, description, user, step },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/MilestoneTracker/addStep",
      session,
      goalId,
      description,
    },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([MilestoneTracker.addStep, {
    goal: goalId,
    description,
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
    await frames.query(Sessioning._getUser, { session }, { user }),
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
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([MilestoneTracker.removeStep, { user, stepId }, { msg }]),
});

export const RemoveStepResponse: Sync = ({ request, msg }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/removeStep" }, { request }],
    [MilestoneTracker.removeStep, {}, { msg }],
  ),
  then: actions([Requesting.respond, { request, msg }]),
});

//-- Query Syncs --//

export const GetGoalRequest: Sync = (
  { request, session, goalId, user, goal, goals },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/_getGoal", session, goalId },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
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
    frames = await frames.query(Sessioning._getUser, { session }, { user });
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
    frames = await frames.query(Sessioning._getUser, { session }, { user });
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
    frames = await frames.query(Sessioning._getUser, { session }, { user });
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
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(MilestoneTracker._getCompleteSteps, {
      goal: goalId,
    }, { step });
    return frames.collectAs([step], steps);
  },
  then: actions([Requesting.respond, { request, steps }]),
});
