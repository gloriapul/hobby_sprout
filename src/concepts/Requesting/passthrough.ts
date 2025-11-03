/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  // PasswordAuthentication - public actions for registration
  "/api/PasswordAuthentication/register": "public action - anyone can register",

  // QuizMatchmaker - public query for quiz questions
  "/api/QuizMatchmaker/getQuestionById": "public query - questions are public",

  // Internal/utility methods (typically not called from frontend)
  "/api/MilestoneTracker/initializeLLM": "internal utility method",
  "/api/MilestoneTracker/validateStepQuality": "internal utility method",
  "/api/QuizMatchmaker/sanitizeHobbyName": "internal utility method",
  "/api/QuizMatchmaker/initializeLLM": "internal utility method",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  // MilestoneTracker - require authentication
  "/api/MilestoneTracker/createGoal",
  "/api/MilestoneTracker/generateSteps",
  "/api/MilestoneTracker/addStep",
  "/api/MilestoneTracker/completeStep",
  "/api/MilestoneTracker/removeStep",
  "/api/MilestoneTracker/closeGoal",
  "/api/MilestoneTracker/regenerateSteps",
  "/api/MilestoneTracker/_getGoal",
  "/api/MilestoneTracker/_getAllGoals",
  "/api/MilestoneTracker/_getSteps",
  "/api/MilestoneTracker/_getIncompleteSteps",
  "/api/MilestoneTracker/_getCompleteSteps",

  // PasswordAuthentication - authenticate and deleteUser require syncs
  "/api/PasswordAuthentication/authenticate",
  "/api/PasswordAuthentication/deleteUser",

  // QuizMatchmaker - require authentication
  "/api/QuizMatchmaker/generateHobbyMatch",
  "/api/QuizMatchmaker/_getAllHobbyMatches",
  "/api/QuizMatchmaker/_getMatchedHobby",
  "/api/QuizMatchmaker/deleteHobbyMatches",

  // UserProfile - all require authentication
  "/api/UserProfile/createProfile",
  "/api/UserProfile/setName",
  "/api/UserProfile/setImage",
  "/api/UserProfile/setHobby",
  "/api/UserProfile/closeHobby",
  "/api/UserProfile/closeProfile",
  "/api/UserProfile/_getUserProfile",
  "/api/UserProfile/_getUserHobbies",
  "/api/UserProfile/_getActiveHobbies",

  // LikertSurvey - not used in this app (template example)
  "/api/LikertSurvey/createSurvey",
  "/api/LikertSurvey/addQuestion",
  "/api/LikertSurvey/submitResponse",
  "/api/LikertSurvey/updateResponse",
  "/api/LikertSurvey/_getSurveyQuestions",
  "/api/LikertSurvey/_getSurveyResponses",
  "/api/LikertSurvey/_getRespondentAnswers",
];
