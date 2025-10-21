# API Specification: HobbySprout Concepts

This document provides the REST API specification for all concepts in the HobbySprout application. All endpoints use the `POST` method and `application/json` content type.

**Base URL:** `/api`

---

## MilestoneTracker Concept

**Purpose:** Allow users to monitor the progress that they are making toward their goals.

### POST /api/MilestoneTracker/createGoal

**Description:** Creates a new goal for a user to track progress towards.

**Requirements:**
- No active Goal for this user already exists
- description is not an empty string

**Effects:**
- Creates a new Goal with the specified user and description
- Sets isActive to true
- Returns the created goal ID

**Request Body:**
```json
{
  "user": "string",
  "description": "string"
}
```

**Success Response Body:**
```json
{
  "goal": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/MilestoneTracker/generateSteps

**Description:** Uses an LLM to generate recommended steps for achieving a goal.

**Requirements:**
- goal exists and is active
- no Steps are currently associated with this goal

**Effects:**
- Uses an internal LLM to generate Step descriptions based on the goal's description
- Creates new Steps associated with the goal
- Sets start date to current date and isComplete to false
- Returns the IDs of the created Steps

**Request Body:**
```json
{
  "goal": "string"
}
```

**Success Response Body:**
```json
{
  "steps": ["string"]
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/MilestoneTracker/addStep

**Description:** Manually adds a step to a goal.

**Requirements:**
- goal exists and is active
- description is not an empty string

**Effects:**
- Creates a new Step with the specified goal and description
- Sets start date to current date and isComplete to false
- Returns the created step ID

**Request Body:**
```json
{
  "goal": "string",
  "description": "string"
}
```

**Success Response Body:**
```json
{
  "step": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/MilestoneTracker/completeStep

**Description:** Marks a step as completed.

**Requirements:**
- step exists and is not already complete
- the Goal associated with step is active

**Effects:**
- Sets isComplete of step to true
- Sets completion date to current date

**Request Body:**
```json
{
  "step": "string"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/MilestoneTracker/removeStep

**Description:** Removes a step from a goal.

**Requirements:**
- step exists
- step is not complete
- the Goal associated with step is active

**Effects:**
- Deletes the step from storage

**Request Body:**
```json
{
  "step": "string"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/MilestoneTracker/closeGoal

**Description:** Closes an active goal.

**Requirements:**
- goal exists and is active

**Effects:**
- Sets isActive of goal to false

**Request Body:**
```json
{
  "goal": "string"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/MilestoneTracker/_getGoal

**Description:** Retrieves the active goal for a user.

**Requirements:**
- user exists

**Effects:**
- Returns an array containing the active Goal (if any) for the user

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body:**
```json
[
  {
    "id": "string",
    "description": "string",
    "isActive": "boolean"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/MilestoneTracker/_getSteps

**Description:** Retrieves all steps for a goal.

**Requirements:**
- goal exists

**Effects:**
- Returns an array of all Steps for the given goal

**Request Body:**
```json
{
  "goal": "string"
}
```

**Success Response Body:**
```json
[
  {
    "id": "string",
    "description": "string",
    "start": "string",
    "completion": "string",
    "isComplete": "boolean"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/MilestoneTracker/_getIncompleteSteps

**Description:** Retrieves all incomplete steps for a goal.

**Requirements:**
- goal exists

**Effects:**
- Returns an array of all incomplete Steps for the given goal

**Request Body:**
```json
{
  "goal": "string"
}
```

**Success Response Body:**
```json
[
  {
    "id": "string",
    "description": "string",
    "start": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/MilestoneTracker/_getCompleteSteps

**Description:** Retrieves all complete steps for a goal.

**Requirements:**
- goal exists

**Effects:**
- Returns an array of all complete Steps for the given goal

**Request Body:**
```json
{
  "goal": "string"
}
```

**Success Response Body:**
```json
[
  {
    "id": "string",
    "description": "string",
    "start": "string",
    "completion": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

## UserProfile Concept

**Purpose:** Allow users to share their personal info.

### POST /api/UserProfile/createProfile

**Description:** Creates a new user profile.

**Requirements:**
- No profile for the given user already exists

**Effects:**
- Creates a new user profile record with active status true
- No initial display name or profile image

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserProfile/setName

**Description:** Sets the display name for a user.

**Requirements:**
- The user must exist in the set of users

**Effects:**
- Sets the user's display name to the provided displayname

**Request Body:**
```json
{
  "user": "string",
  "displayname": "string"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserProfile/setImage

**Description:** Sets the profile image for a user.

**Requirements:**
- The user must exist in the set of users

**Effects:**
- Sets the user's profile image to the provided image URL

**Request Body:**
```json
{
  "user": "string",
  "image": "string"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserProfile/setHobby

**Description:** Sets an active hobby for a user.

**Requirements:**
- The user must exist in the set of Users
- The hobby must not already be active for the specified user

**Effects:**
- If no UserHobby record exists, creates one and marks as active
- If UserHobby record exists but is inactive, updates to active

**Request Body:**
```json
{
  "user": "string",
  "hobby": "string"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserProfile/closeHobby

**Description:** Deactivates a hobby for a user.

**Requirements:**
- The user must exist in the set of Users
- A UserHobby record for the specified user and hobby must exist and be active

**Effects:**
- Sets the active status of the specified UserHobby record to false

**Request Body:**
```json
{
  "user": "string",
  "hobby": "string"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserProfile/closeProfile

**Description:** Closes a user profile.

**Requirements:**
- The user must exist in the set of Users

**Effects:**
- Sets the active status of the user's profile to false

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserProfile/_getUserProfile

**Description:** Retrieves a user's profile information.

**Requirements:**
- User must exist in the set of users

**Effects:**
- Returns the full profile data for the specified user

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body:**
```json
[
  {
    "_id": "string",
    "active": "boolean",
    "displayname": "string",
    "profile": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserProfile/_getUserHobbies

**Description:** Retrieves all hobbies for a user.

**Requirements:**
- User must exist in the set of users

**Effects:**
- Returns all hobbies associated with the specified user

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body:**
```json
[
  {
    "hobby": "string",
    "active": "boolean"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserProfile/_getActiveHobbies

**Description:** Retrieves active hobbies for a user.

**Requirements:**
- User must exist in the set of users

**Effects:**
- Returns only the names of all active hobbies for the specified user

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body:**
```json
[
  {
    "hobby": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

## QuizMatchmaker Concept

**Purpose:** To match users with suitable hobbies based on their responses to a predefined, fixed quiz.

### POST /api/QuizMatchmaker/submitResponse

**Description:** Records a user's response to a quiz question.

**Requirements:**
- The question ID must correspond to one of the predefined questions
- The user has not yet submitted a response for this specific question

**Effects:**
- Records the user's answerText for the given question

**Request Body:**
```json
{
  "user": "string",
  "question": "string",
  "answerText": "string"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/QuizMatchmaker/updateResponse

**Description:** Updates a user's existing response to a quiz question.

**Requirements:**
- The question ID must correspond to one of the predefined questions
- The user has already submitted a response for this specific question
- No HobbyMatch exists for this user

**Effects:**
- Updates the user's answerText for the given question

**Request Body:**
```json
{
  "user": "string",
  "question": "string",
  "newAnswerText": "string"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/QuizMatchmaker/generateHobbyMatch

**Description:** Generates a hobby match for a user based on their quiz responses.

**Requirements:**
- The user has submitted responses for all predefined Questions
- No HobbyMatch already exists for this user

**Effects:**
- Uses an LLM to analyze the user's responses and generate a matched hobby
- Stores the match and returns it

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body:**
```json
{
  "matchedHobby": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/QuizMatchmaker/deleteHobbyMatch

**Description:** Deletes a user's hobby match so they can generate a new one.

**Requirements:**
- A HobbyMatch exists for this user

**Effects:**
- Deletes the existing HobbyMatch

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body:**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/QuizMatchmaker/_getQuestions

**Description:** Retrieves all predefined quiz questions.

**Requirements:**
- None (always available)

**Effects:**
- Returns an array of all predefined quiz questions, ordered by order

**Request Body:**
```json
{}
```

**Success Response Body:**
```json
[
  {
    "_id": "string",
    "text": "string",
    "order": "number"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/QuizMatchmaker/_getUserResponses

**Description:** Retrieves all responses submitted by a user.

**Requirements:**
- The user exists

**Effects:**
- Returns all UserResponses submitted by the user

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body:**
```json
[
  {
    "question": "string",
    "answerText": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/QuizMatchmaker/_getMatchedHobby

**Description:** Retrieves the matched hobby for a user.

**Requirements:**
- The user exists and has a HobbyMatch

**Effects:**
- Returns the matchedHobby for the user

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body:**
```json
[
  "string"
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

## PasswordAuthentication Concept

**Purpose:** Associate usernames and passwords with user identities for authentication purposes, thereby limiting access to known users.

### POST /api/PasswordAuthentication/register

**Description:** Registers a new user with username and password.

**Requirements:**
- No User with the given username already exists

**Effects:**
- Creates a new User instance with the provided username and password
- Returns the user ID

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body:**
```json
{
  "user": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/PasswordAuthentication/authenticate

**Description:** Authenticates a user with username and password.

**Requirements:**
- A User with the given username exists AND the password matches the stored password

**Effects:**
- Returns the identifier of the authenticated User

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body:**
```json
{
  "user": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```