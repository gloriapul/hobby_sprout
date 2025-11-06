import { Collection, Db } from "mongodb";
import { Empty, ID } from "@utils/types.ts";
import { GeminiLLM } from "@utils/gemini-llm.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "QuizMatchmaker" + ".";

// Generic types for the concept
type User = ID;

// For hardcoded questions
export type Question = ID;

/**
 * Interface for the structure of a hardcoded quiz question.
 */
export interface HardcodedQuestion {
  _id: Question; // unique ID for the question
  text: string; // actual text of the quiz question
  order: number; // order in which questions should be presented, unique
}

/**
 * HARDCODED QUIZ QUESTIONS
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
 * State:
 * A set of HobbyMatches, storing the matched hobby for each user.
 * Each document represents the final hobby match for a user.
 */
interface HobbyMatchDoc {
  _id: ID; // Unique ID for this match (freshID)
  user: User; // The user who took the quiz
  matchedHobby: string; // The hobby suggested by the LLM
  matchedAt: Date; // Timestamp when the match was generated
}

/**
 * @concept QuizMatchmaker
 * @purpose To match users with suitable hobbies based on their responses to a predefined quiz, leveraging an LLM for intelligent matching.
 */
export default class QuizMatchmakerConcept {
  private hobbyMatches: Collection<HobbyMatchDoc>;
  private llm: GeminiLLM | null = null;

  constructor(private readonly db: Db, apiKey?: string) {
    this.hobbyMatches = this.db.collection(PREFIX + "hobbyMatches");

    // initialize LLM if API key is provided
    if (apiKey) {
      this.initializeLLM(apiKey);
    }
  }

  /**
   * Helper: sanitize the hobby name returned by the LLM.
   */
  private sanitizeHobbyName(raw: string): string | undefined {
    // take first non-empty line
    const firstLine =
      (raw.split(/\r?\n/).find((l) => l.trim().length > 0) || "").trim();
    if (!firstLine) return undefined;

    // strip surrounding backticks or quotes
    let s = firstLine.replace(/^[`'"\s]+|[`'"\s]+$/g, "").trim();

    // remove an optional leading label like "Hobby:" or "Suggested hobby:"
    s = s.replace(/^(suggested\s+hobby|hobby)\s*:\s*/i, "");

    // if multiple suggestions separated by comma or ' and ', pick the first piece
    const splitDelim = s.includes(",")
      ? ","
      : (/(\s+and\s+)/i.test(s) ? /\s+and\s+/i : null);
    if (splitDelim) {
      s = s.split(splitDelim)[0].trim();
    }

    // trim trailing punctuation like periods/semicolons/colons/exclamations
    s = s.replace(/[\.;:!]+$/g, "").trim();

    // basic check
    if (s.length < 1 || s.length > 60) return undefined;

    return s;
  }

  /**
   * Helper: initializes the LLM with the provided API key
   */
  initializeLLM(apiKey: string): void {
    try {
      this.llm = new GeminiLLM({ apiKey });
    } catch (error) {
      console.warn("Failed to initialize LLM:", error);
      this.llm = null;
    }
  }

  /**
   * Action: Generates a hobby match for a user based on their quiz responses using an LLM.
   *
   * @returns An object containing the suggested matched hobby string, or an error message.
   *
   * @effects Uses an LLM to analyze the answers, generates a `matchedHobby` string, stores it, and returns it.
   */
  async generateHobbyMatch(
    { user, answers }: { user: User; answers: string[] },
  ): Promise<{ matchedHobby: string } | { error: string }> {
    if (!Array.isArray(answers) || answers.length !== QUIZ_QUESTIONS.length) {
      return {
        error: `Must provide exactly ${QUIZ_QUESTIONS.length} answers.`,
      };
    }

    if (!this.llm) {
      return {
        error: "LLM not initialized. API key might be missing or invalid.",
      };
    }

    let prompt =
      "Based on the following quiz answers, suggest a single hobby that would best suit the user. Your answer should only be the name of the hobby, e.g., 'Gardening' or 'Photography', and nothing else. Do not include any introductory or concluding remarks, just the hobby name.\n\nQuestions and Answers:\n";
    for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
      prompt += `Q: ${QUIZ_QUESTIONS[i].text}\nA: ${answers[i]}\n`;
    }

    try {
      const responseText = await this.llm.executeLLM(prompt);
      const matchedHobby = this.sanitizeHobbyName(responseText);

      if (!matchedHobby) {
        return {
          error: "LLM returned an empty or unparseable hobby suggestion.",
        };
      }

      await this.hobbyMatches.insertOne({
        _id: freshID(),
        user,
        matchedHobby,
        matchedAt: new Date(),
      });
      return { matchedHobby };
    } catch (llmError: unknown) {
      return {
        error: `Failed to generate hobby match with LLM: ${
          llmError instanceof Error ? llmError.message : "Unknown LLM error"
        }`,
      };
    }
  }

  /**
   * Action: Deletes all hobby matches for a user.
   *
   * @returns A promise that resolves to an empty object on success, or an error object if no matches were found.
   * @effects Permanently removes all hobby match records for the specified user from the database.
   */
  async deleteHobbyMatches(
    { user }: { user: User },
  ): Promise<Empty | { error: string }> {
    const result = await this.hobbyMatches.deleteMany({ user });
    if (result.deletedCount === 0) {
      return { error: `No hobby matches exist for user ${user}.` };
    }
    return {};
  }

  /**
   * Query: Retrieves all hobby matches for a specific user, sorted by most recent first.
   *
   * @returns A promise that resolves to an array of hobby match objects, each containing the match ID, hobby name, and timestamp. Returns an empty array if no matches are found.
   * @effects Queries the database for all hobby matches associated with the given user.
   */
  async _getAllHobbyMatches(
    { user }: { user: User },
  ): Promise<{ id: ID; hobby: string; matchedAt: Date }[]> {
    const matches = await this.hobbyMatches.find({ user }).sort({
      matchedAt: -1,
    }).toArray();
    if (!matches.length) {
      return [];
    }
    return matches.map((m) => ({
      id: m._id,
      hobby: m.matchedHobby,
      matchedAt: m.matchedAt,
    }));
  }
}
