import { Collection, Db } from "mongodb";
import { Empty, ID } from "@utils/types.ts";
import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import { load } from "@std/dotenv";

// Collection prefix to ensure namespace separation
const PREFIX = "QuizMatchmaker" + ".";

// Generic types for the concept's external dependencies
type User = ID;

// Internal entity type for Question IDs (referencing hardcoded questions)
export type Question = ID;

/**
 * Interface for the structure of a hardcoded quiz question.
 */
export interface HardcodedQuestion {
  _id: Question; // Unique ID for the question
  text: string; // The actual text of the quiz question
  order: number; // Order in which questions should be presented, unique
}

/**
 * **HARDCODED QUIZ QUESTIONS**
 * These questions define the quiz structure and are immutable.
 * The _id values are arbitrary unique strings for identification.
 */
export const QUIZ_QUESTIONS: HardcodedQuestion[] = [
  {
    _id: "q_1" as Question,
    text: "Do you prefer spending your free time indoors or outdoors?",
    order: 1,
  },
  {
    _id: "q_2" as Question,
    text: "Are you more drawn to creative activities or analytical challenges?",
    order: 2,
  },
  {
    _id: "q_3" as Question,
    text: "How important is social interaction in your ideal hobby?",
    order: 3,
  },
  {
    _id: "q_4" as Question,
    text: "Do you enjoy learning new skills, or perfecting existing ones?",
    order: 4,
  },
  {
    _id: "q_5" as Question,
    text:
      "What kind of physical exertion are you comfortable with for a hobby?",
    order: 5,
  },
];

/**
 * State: A set of UserResponses, linking a user, a question, and their text answer.
 * Each document represents one user's answer to one specific question.
 */
interface UserResponseDoc {
  _id: ID; // Unique ID for this specific user response entry (using freshID)
  user: User; // The ID of the user who provided the answer
  question: Question; // The ID of the question being answered (references a QUIZ_QUESTIONS._id)
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
  private userResponses: Collection<UserResponseDoc>;
  private hobbyMatches: Collection<HobbyMatchDoc>;
  private llmModel: GenerativeModel | null = null;

  constructor(private readonly db: Db) {
    this.userResponses = this.db.collection(PREFIX + "userResponses");
    this.hobbyMatches = this.db.collection(PREFIX + "hobbyMatches");
  }

  /**
   * Initializes the LLM model with configuration from environment
   */
  async initializeLLM(): Promise<void> {
    try {
      // Load environment variables from .env file
      const env = await load();
      const apiKey = env["GEMINI_API_KEY"] || Deno.env.get("GEMINI_API_KEY");
      const modelName = env["GEMINI_MODEL"] || "gemini-pro";

      if (!apiKey) {
        throw new Error("GEMINI_API_KEY not found in environment or .env file");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      this.llmModel = genAI.getGenerativeModel({ model: modelName });
    } catch (error) {
      console.warn("Failed to initialize LLM:", error);
      this.llmModel = null;
      throw error;
    }
  }

  /**
   * Helper to validate if a given question ID exists in our hardcoded list.
   * @param questionId The ID of the question to check.
   * @returns The HardcodedQuestion object if found, otherwise undefined.
   */
  public getQuestionById(questionId: Question): HardcodedQuestion | undefined {
    return QUIZ_QUESTIONS.find((q) => q._id === questionId);
  }

  /**
   * Action: Allows a user to submit their response to a specific quiz question.
   *
   * @param user - The ID of the user submitting the response.
   * @param question - The ID of the question being answered (must be one of the predefined quiz questions).
   * @param answerText - The user's free-form text answer.
   * @returns An empty object for success, or an error message.
   *
   * @requires The `question` ID must correspond to one of the predefined questions. The `user` has not yet submitted a response for this specific `question`.
   * @effects Records the `user`'s `answerText` for the given `question`.
   */
  async submitResponse(
    { user, question, answerText }: {
      user: User;
      question: Question;
      answerText: string;
    },
  ): Promise<Empty | { error: string }> {
    if (!this.getQuestionById(question)) {
      return {
        error:
          `Question with ID ${question} is not a valid predefined quiz question.`,
      };
    }

    const existingResponse = await this.userResponses.findOne({
      user,
      question,
    });
    if (existingResponse) {
      return {
        error:
          `User ${user} has already submitted a response for question ${question}. Use updateResponse to change it.`,
      };
    }

    // Using a freshID for the _id of the user response document itself,
    // as the primary key for UserResponses is implicitly (user, question) tuple.
    await this.userResponses.insertOne({
      _id: `response_${user}_${question}` as ID,
      user,
      question,
      answerText,
    });
    return {};
  }

  /**
   * Action: Updates an existing response from a user to a specific quiz question.
   *
   * @param user - The ID of the user whose response is being updated.
   * @param question - The ID of the question for which the response is being updated (must be one of the predefined quiz questions).
   * @param newAnswerText - The new free-form text answer.
   * @returns An empty object for success, or an error message.
   *
   * @requires The `question` ID must correspond to one of the predefined questions. The `user` has already submitted a response for this specific `question`. No `HobbyMatch` exists for this `user`.
   * @effects Updates the `user`'s `answerText` for the given `question`.
   */
  async updateResponse(
    { user, question, newAnswerText }: {
      user: User;
      question: Question;
      newAnswerText: string;
    },
  ): Promise<Empty | { error: string }> {
    if (!this.getQuestionById(question)) {
      return {
        error:
          `Question with ID ${question} is not a valid predefined quiz question.`,
      };
    }

    const existingResponse = await this.userResponses.findOne({
      user,
      question,
    });
    if (!existingResponse) {
      return {
        error:
          `User ${user} has not submitted a response for question ${question} yet. Use submitResponse to create it.`,
      };
    }

    const existingMatch = await this.hobbyMatches.findOne({ _id: user });
    if (existingMatch) {
      return {
        error:
          `Cannot update response for user ${user} as a hobby match has already been generated. Delete the match first if you wish to update answers.`,
      };
    }

    await this.userResponses.updateOne({ user, question }, {
      $set: { answerText: newAnswerText },
    });
    return {};
  }

  /**
   * Action: Generates a hobby match for a user based on their quiz responses using an LLM.
   *
   * @param user - The ID of the user for whom to generate a match.
   * @returns An object containing the suggested matched hobby string, or an error message.
   *
   * @requires The `user` has submitted responses for all *predefined* `Questions`. No `HobbyMatch` already exists for this `user`.
   * @effects Uses an LLM to analyze the `user`'s `UserResponses` to `Questions`, generates a `matchedHobby` string, stores it, and returns it.
   */
  async generateHobbyMatch(
    { user }: { user: User },
  ): Promise<{ matchedHobby: string } | { error: string }> {
    if (!this.llmModel) {
      return {
        error:
          "LLM model not initialized. GEMINI_API_KEY might be missing or invalid.",
      };
    }

    const allQuestions = QUIZ_QUESTIONS; // Directly use hardcoded questions
    if (allQuestions.length === 0) {
      // This should ideally not happen if QUIZ_QUESTIONS is properly defined
      return {
        error:
          "No quiz questions defined within the concept. This is an internal configuration error.",
      };
    }

    const userResponses = await this.userResponses.find({ user }).toArray();
    if (userResponses.length !== allQuestions.length) {
      return {
        error:
          `User ${user} has not answered all ${allQuestions.length} questions. Please submit responses for all questions.`,
      };
    }

    const existingMatch = await this.hobbyMatches.findOne({ _id: user });
    if (existingMatch) {
      return {
        error:
          `User ${user} already has a generated hobby match: "${existingMatch.matchedHobby}".`,
      };
    }

    // Prepare prompt for LLM
    let prompt =
      "Based on the following quiz answers, suggest a single hobby that would best suit the user. Your answer should only be the name of the hobby, e.g., 'Gardening' or 'Photography', and nothing else. Do not include any introductory or concluding remarks, just the hobby name.\n\nQuestions and Answers:\n";
    for (const q of allQuestions) {
      const response = userResponses.find((r) => r.question === q._id);
      if (response) {
        prompt += `Q: ${q.text}\nA: ${response.answerText}\n`;
      } else {
        // This case should be prevented by the userResponses.length check, but as a safeguard:
        return { error: `Missing response for question: ${q.text}.` };
      }
    }

    try {
      // We can assert non-null here since we checked above
      const result = await this.llmModel!.generateContent(prompt);
      const responseText = result.response.text();
      const matchedHobby = responseText.trim(); // Assuming LLM returns just the hobby name

      if (!matchedHobby) {
        return {
          error: "LLM returned an empty or unparseable hobby suggestion.",
        };
      }

      await this.hobbyMatches.insertOne({
        _id: user,
        matchedHobby,
        matchedAt: new Date(),
      });
      return { matchedHobby };
    } catch (llmError: unknown) {
      console.error("LLM Generation Error:", llmError);
      return {
        error: `Failed to generate hobby match with LLM: ${
          llmError instanceof Error ? llmError.message : "Unknown LLM error"
        }`,
      };
    }
  }

  /**
   * Query: Retrieves all predefined quiz questions.
   *
   * @returns An array of question objects, sorted by their `order`.
   *
   * @requires true
   * @effects Returns an array of all *predefined* quiz questions, ordered by `order`.
   */
  _getQuestions(): HardcodedQuestion[] {
    // Return a copy to ensure immutability
    return [...QUIZ_QUESTIONS].sort((a, b) => a.order - b.order);
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
  async _getUserResponses(
    { user }: { user: User },
  ): Promise<{ question: Question; answerText: string }[]> {
    return (await this.userResponses.find({ user }).project({
      question: 1,
      answerText: 1,
      _id: 0,
    }).toArray()) as { question: Question; answerText: string }[];
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
  async _getMatchedHobby(
    { user }: { user: User },
  ): Promise<{ hobby: string }[] | { error: string }> {
    const match = await this.hobbyMatches.findOne({ _id: user });
    if (!match) {
      return { error: `No hobby match found for user ${user}.` };
    }
    return [{ hobby: match.matchedHobby }];
  }

  /**
   * ADMIN Action: Clears all user responses. Use with extreme caution.
   * This action is intended for **administrative setup** only.
   *
   * @requires For administrative use only.
   * @effects Deletes all user responses.
   */
  async _clearAllUserResponses(): Promise<Empty> {
    await this.userResponses.deleteMany({});
    return {};
  }

  /**
   * ADMIN Action: Clears all hobby matches. Use with extreme caution.
   * This action is intended for **administrative setup** only.
   *
   * @requires For administrative use only.
   * @effects Deletes all hobby matches.
   */
  async _clearAllHobbyMatches(): Promise<Empty> {
    await this.hobbyMatches.deleteMany({});
    return {};
  }
}
