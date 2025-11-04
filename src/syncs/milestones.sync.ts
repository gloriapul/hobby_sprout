/**
 * MilestoneTracker Synchronizations
 *
 * Handles goal and step management for milestone tracking.
 */

import { MilestoneTracker, Requesting, Sessioning } from "@concepts";
import { actions, Frames, Sync } from "@engine";

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

export const CreateGoalResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/createGoal" }, { request }],
    [MilestoneTracker.createGoal, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const CloseGoalRequest: Sync = (
  { request, session, goalId, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/closeGoal", session, goalId },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([MilestoneTracker.closeGoal, { user, goalId }, {}]),
});

export const CloseGoalResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/closeGoal" }, { request }],
    [MilestoneTracker.closeGoal, {}, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

export const CloseGoalResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/closeGoal" }, { request }],
    [MilestoneTracker.closeGoal, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
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
  then: actions([MilestoneTracker.generateSteps, { user, goal: goalId }, {
    steps,
  }]),
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

export const GenerateStepsResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/generateSteps" }, {
      request,
    }],
    [MilestoneTracker.generateSteps, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
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
  then: actions([MilestoneTracker.regenerateSteps, { user, goal: goalId }, {
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

export const RegenerateStepsResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/regenerateSteps" }, {
      request,
    }],
    [MilestoneTracker.regenerateSteps, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
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
  { request, session, stepId, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/completeStep", session, stepId },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([MilestoneTracker.completeStep, { user, stepId }, {}]),
});

export const CompleteStepResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/completeStep" }, {
      request,
    }],
    [MilestoneTracker.completeStep, {}, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

export const CompleteStepResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/completeStep" }, {
      request,
    }],
    [MilestoneTracker.completeStep, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const RemoveStepRequest: Sync = (
  { request, session, stepId, user },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/removeStep", session, stepId },
    { request },
  ]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([MilestoneTracker.removeStep, { user, stepId }, {}]),
});

export const RemoveStepResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/removeStep" }, { request }],
    [MilestoneTracker.removeStep, {}, {}],
  ),
  then: actions([Requesting.respond, { request, msg: {} }]),
});

export const RemoveStepResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/MilestoneTracker/removeStep" }, { request }],
    [MilestoneTracker.removeStep, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

//-- Query Syncs --//

export const GetGoalRequest: Sync = (
  {
    request,
    session,
    hobby,
    user,
    goalId,
    goalDescription,
    goalHobby,
    goalIsActive,
    goals,
  },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/_getGoal", session, hobby },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(
      MilestoneTracker._getGoal,
      { user, hobby },
      {
        id: goalId,
        description: goalDescription,
        hobby: goalHobby,
        isActive: goalIsActive,
      },
    );
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [goals]: [] });
    }
    return frames.collectAs(
      [goalId, goalDescription, goalHobby, goalIsActive],
      goals,
    );
  },
  then: actions([Requesting.respond, { request, goals }]),
});

export const GetGoalsRequest: Sync = (
  {
    request,
    session,
    user,
    goalId,
    goalDescription,
    goalHobby,
    goalIsActive,
    goals,
  },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/_getGoals", session },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(
      MilestoneTracker._getGoals,
      { user },
      {
        id: goalId,
        description: goalDescription,
        hobby: goalHobby,
        isActive: goalIsActive,
      },
    );
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [goals]: [] });
    }
    return frames.collectAs(
      [goalId, goalDescription, goalHobby, goalIsActive],
      goals,
    );
  },
  then: actions([Requesting.respond, { request, goals }]),
});

export const GetAllGoalsRequest: Sync = (
  {
    request,
    session,
    hobby,
    user,
    goalId,
    goalDescription,
    goalHobby,
    goalIsActive,
    goals,
  },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/_getAllGoals", session, hobby },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(
      MilestoneTracker._getAllGoals,
      { user, hobby },
      {
        id: goalId,
        description: goalDescription,
        hobby: goalHobby,
        isActive: goalIsActive,
      },
    );
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [goals]: [] });
    }
    return frames.collectAs(
      [goalId, goalDescription, goalHobby, goalIsActive],
      goals,
    );
  },
  then: actions([Requesting.respond, { request, goals }]),
});

export const GetStepsRequest: Sync = (
  {
    request,
    session,
    goalId,
    user,
    id,
    description,
    start,
    completion,
    isComplete,
    steps,
  },
) => ({
  when: actions([
    Requesting.request,
    { path: "/MilestoneTracker/_getSteps", session, goalId },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(
      MilestoneTracker._getSteps,
      { goal: goalId },
      { id, description, start, completion, isComplete },
    );
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [steps]: [] });
    }
    return frames.collectAs(
      [id, description, start, completion, isComplete],
      steps,
    );
  },
  then: actions([Requesting.respond, { request, steps }]),
});
