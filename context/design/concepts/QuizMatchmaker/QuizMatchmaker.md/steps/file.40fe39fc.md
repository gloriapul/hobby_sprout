---
timestamp: 'Fri Oct 17 2025 00:32:26 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_003226.80758401.md]]'
content_id: 40fe39fc339e13ba10c79eff352769ae1358584fdaeb5e07b1df0299664c6fb9
---

# file: src/quizmatchmaker/QuizMatchmakerConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "@std/dotenv"; // To load API key from .env

// Load environment variables for the API key
// NOTE: Make sure to have a .env file with GEMINI_API_KEY=<your_gemini_api_key>
const env = await config();
const GEMINI_API_KEY = env["GEMINI_API_KEY"];

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. LLM functionality will be disabled or fail.");
}

// Initialize Gemini API client
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-pro" }) : null;


// Collection prefix to ensure namespace separation
const PREFIX = "QuizMatchmaker" + ".";

// Generic types for the concept's external dependencies
type User = ID;

// Internal entity types, represented as IDs
type Question = ID;

/**
 * State: A set of Questions that define the quiz.
 * Each document represents a single question in the quiz.
 */
interface QuestionDoc {
  _id: Question; // Unique ID for the question
  text: string;  // The actual text of the quiz question
  order: number; // Order in which questions should be presented, unique
}

/**
 * State: A set of UserResponses, linking a user, a question, and their text answer.
 * Each document represents one user's answer to one specific question.
 */
interface UserResponseDoc {
  _id: ID; // Unique ID for this specific user response entry
  user: User; // The ID of the user who provided the answer
  question: Question; // The ID of the question being answered
  answerText: string; // The user's free-form text answer
}

/**
 * State: A set of HobbyMatches, storing the matched hobby for each user.
 * Each document represents the final hobby match for a user.
 */
interface HobbyMatchDoc {
  _id: User; // The ID of the user, acting as the primary key for their hobby match
  matchedHobby: string; // The hobby suggested by the LLM
  matchedAt: Date; // Timestamp when the match was generated
}

/**
 * @concept QuizMatchmaker
 * @purpose To match users with suitable hobbies based on their responses to a predefined quiz, leveraging an LLM for intelligent matching.
 */
export default class QuizMatchmakerConcept {
  questions: Collection<QuestionDoc>;
  userResponses: Collection<UserResponseDoc>;
  hobbyMatches: Collection<HobbyMatchDoc>;

  constructor(private readonly db: Db) {
    this.questions = this.db.collection(PREFIX + "questions");
    this.userResponses = this.db.collection(PREFIX + "userResponses");
    this.hobbyMatches = this.db.collection(PREFIX + "hobbyMatches");
  }

  /**
   * Action: Adds a new question to the quiz.
   *
   * @param text - The text content of the question.
   * @param order - The desired display order for the question (must be unique).
   * @returns An object containing the ID of the new question, or an error message.
   *
   * @requires No other question with the same `order` already exists.
   * @effects A new question is added to the quiz with the specified text and order.
   */
  async addQuestion({ text, order }: { text: string; order: number }): Promise<{ question: Question } | { error: string }> {
    const existingQuestion = await this.questions.findOne({ order });
    if (existingQuestion) {
      return { error: `Question with order ${order} already exists.` };
    }

    const questionId = freshID() as Question;
    await this.questions.insertOne({ _id: questionId, text, order });
    return { question: questionId };
  }

  /**
   * Action: Allows a user to submit their response to a specific quiz question.
   *
   * @param user - The ID of the user submitting the response.
   * @param question - The ID of the question being answered.
   * @param answerText - The user's free-form text answer.
   * @returns An empty object for success, or an error message.
   *
   * @requires The `question` exists. The `user` has not yet submitted a response for this specific `question`.
   * @effects Records the `user`'s `answerText` for the given `question`.
   */
  async submitResponse({ user, question, answerText }: { user: User; question: Question; answerText: string }): Promise<Empty | { error: string }> {
    const existingQuestion = await this.questions.findOne({ _id: question });
    if (!existingQuestion) {
      return { error: `Question with ID ${question} not found.` };
    }

    const existingResponse = await this.userResponses.findOne({ user, question });
    if (existingResponse) {
      return { error: `User ${user} has already submitted a response for question ${question}. Use updateResponse to change it.` };
    }

    await this.userResponses.insertOne({ _id: freshID() as ID, user, question, answerText });
    return {};
  }

  /**
   * Action: Updates an existing response from a user to a specific quiz question.
   *
   * @param user - The ID of the user whose response is being updated.
   * @param question - The ID of the question for which the response is being updated.
   * @param newAnswerText - The new free-form text answer.
   * @returns An empty object for success, or an error message.
   *
   * @requires The `question` exists. The `user` has already submitted a response for this specific `question`. No `HobbyMatch` exists for this `user`.
   * @effects Updates the `user`'s `answerText` for the given `question`.
   */
  async updateResponse({ user, question, newAnswerText }: { user: User; question: Question; newAnswerText: string }): Promise<Empty | { error: string }> {
    const existingQuestion = await this.questions.findOne({ _id: question });
    if (!existingQuestion) {
      return { error: `Question with ID ${question} not found.` };
    }

    const existingResponse = await this.userResponses.findOne({ user, question });
    if (!existingResponse) {
      return { error: `User ${user} has not submitted a response for question ${question} yet. Use submitResponse to create it.` };
    }

    const existingMatch = await this.hobbyMatches.findOne({ _id: user });
    if (existingMatch) {
      return { error: `Cannot update response for user ${user} as a hobby match has already been generated. Delete the match first if you wish to update answers.` };
    }

    await this.userResponses.updateOne({ user, question }, { $set: { answerText: newAnswerText } });
    return {};
  }

  /**
   * Action: Generates a hobby match for a user based on their quiz responses using an LLM.
   *
   * @param user - The ID of the user for whom to generate a match.
   * @returns An object containing the suggested matched hobby string, or an error message.
   *
   * @requires The `user` has submitted responses for all currently defined `Questions`. No `HobbyMatch` already exists for this `user`.
   * @effects Uses an LLM to analyze the `user`'s `UserResponses` to `Questions`, generates a `matchedHobby` string, stores it, and returns it.
   */
  async generateHobbyMatch({ user }: { user: User }): Promise<{ matchedHobby: string } | { error: string }> {
    if (!model) {
      return { error: "LLM model not initialized. GEMINI_API_KEY might be missing or invalid." };
    }

    const allQuestions = await this.questions.find().sort({ order: 1 }).toArray();
    if (allQuestions.length === 0) {
      return { error: "No quiz questions defined yet. Please add questions first." };
    }

    const userResponses = await this.userResponses.find({ user }).toArray();
    if (userResponses.length !== allQuestions.length) {
      return { error: `User ${user} has not answered all ${allQuestions.length} questions. Please submit responses for all questions.` };
    }

    const existingMatch = await this.hobbyMatches.findOne({ _id: user });
    if (existingMatch) {
      return { error: `User ${user} already has a generated hobby match: "${existingMatch.matchedHobby}".` };
    }

    // Prepare prompt for LLM
    let prompt = "Based on the following quiz answers, suggest a single hobby that would best suit the user. Your answer should only be the name of the hobby, e.g., 'Gardening' or 'Photography', and nothing else. Do not include any introductory or concluding remarks, just the hobby name.\n\nQuestions and Answers:\n";
    for (const q of allQuestions) {
      const response = userResponses.find(r => r.question === q._id);
      if (response) {
        prompt += `Q: ${q.text}\nA: ${response.answerText}\n`;
      }
    }

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const matchedHobby = responseText.trim(); // Assuming LLM returns just the hobby name

      if (!matchedHobby) {
          return { error: "LLM returned an empty or unparseable hobby suggestion." };
      }

      await this.hobbyMatches.insertOne({ _id: user, matchedHobby, matchedAt: new Date() });
      return { matchedHobby };
    } catch (llmError: any) {
      console.error("LLM Generation Error:", llmError);
      return { error: `Failed to generate hobby match with LLM: ${llmError.message || "Unknown LLM error"}` };
    }
  }

  /**
   * Query: Retrieves all defined quiz questions.
   *
   * @returns An array of question objects, sorted by their `order`.
   *
   * @requires true
   * @effects Returns an array of all defined quiz questions, ordered by `order`.
   */
  async _getQuestions(): Promise<{ id: Question; text: string; order: number }[]> {
    return (await this.questions.find().sort({ order: 1 }).toArray()).map(q => ({ id: q._id, text: q.text, order: q.order }));
  }

  /**
   * Query: Retrieves all responses submitted by a specific user.
   *
   * @param user - The ID of the user.
   * @returns An array of response objects, each containing the question ID and the answer text.
   *
   * @requires The `user` exists (implicitly, or the array will be empty).
   * @effects Returns all `UserResponses` submitted by the `user`.
   */
  async _getUserResponses({ user }: { user: User }): Promise<{ question: Question; answerText: string }[]> {
    return (await this.userResponses.find({ user }).toArray()).map(r => ({ question: r.question, answerText: r.answerText }));
  }

  /**
   * Query: Retrieves the matched hobby for a specific user.
   *
   * @param user - The ID of the user.
   * @returns An array containing an object with the matched hobby string, or an error message.
   *
   * @requires The `user` exists and has a `HobbyMatch`.
   * @effects Returns the `matchedHobby` for the `user`.
   */
  async _getMatchedHobby({ user }: { user: User }): Promise<{ hobby: string }[] | { error: string }> {
    const match = await this.hobbyMatches.findOne({ _id: user });
    if (!match) {
      return { error: `No hobby match found for user ${user}.` };
    }
    return [{ hobby: match.matchedHobby }];
  }

    /**
   * ADMIN Action: Clears all quiz questions. Use with caution.
   * @requires For administrative use only.
   * @effects Deletes all questions from the quiz.
   */
    async _clearAllQuestions(): Promise<Empty> {
      await this.questions.deleteMany({});
      return {};
    }

    /**
   * ADMIN Action: Clears all user responses. Use with caution.
   * @requires For administrative use only.
   * @effects Deletes all user responses.
   */
    async _clearAllUserResponses(): Promise<Empty> {
      await this.userResponses.deleteMany({});
      return {};
    }

    /**
   * ADMIN Action: Clears all hobby matches. Use with caution.
   * @requires For administrative use only.
   * @effects Deletes all hobby matches.
   */
    async _clearAllHobbyMatches(): Promise<Empty> {
      await this.hobbyMatches.deleteMany({});
      return {};
    }
}
```
