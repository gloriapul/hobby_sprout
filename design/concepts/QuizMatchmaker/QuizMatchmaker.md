[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

[@likert](../LikertSurvey/implementation.md)

# implement: QuizMatchmaker.

# response:

*   **concept**: QuizMatchmaker \[User]
*   **purpose**: To match users with suitable hobbies based on their responses to a *predefined, fixed* quiz.
*   **principle**: If a user provides answers to all predefined quiz questions in a single submission, the system will use an LLM to analyze these responses and suggest a specific hobby that aligns with the user's interests. The user can generate and view multiple hobby matches over time, each stored as a separate match.
*   **state**:
  *   A set of `HobbyMatches` with
    *   a `user` of type `User`
    *   a `matchedHobby` of type `String`
    *   a `matchedAt` of type `DateTime`
    *   an `_id` of type `ID` (unique for each match)
*   **actions**:
  *   `generateHobbyMatch (user: User, answers: String[5]): (matchedHobby: String)`
    *   **requires**: The `answers` array must have exactly 5 strings, corresponding to the predefined questions. The LLM must be initialized.
    *   **effects**: Uses an LLM to analyze the answers, generates a `matchedHobby` string, stores it as a new match, and returns it. Users can generate multiple matches over time.
  *   `deleteHobbyMatches (user: User)`
    *   **requires**: At least one `HobbyMatch` exists for this `user`.
    *   **effects**: Deletes all `HobbyMatches` for the user.
  *   `deleteHobbyMatchById (user: User, matchId: ID)`
    *   **requires**: The specified `HobbyMatch` exists for this `user`.
    *   **effects**: Deletes only the specified `HobbyMatch` for the user.
  *   `initializeLLM (apiKey: String)`
    *   **requires**: A valid API key is provided.
    *   **effects**: Initializes the LLM for use in generating hobby matches.
*   **queries**:
  *   `_getQuestions (): (question: { _id: Question, text: String, order: Number })[]`
    *   **requires**: true
    *   **effects**: Returns an array of all *predefined* quiz questions, ordered by `order`.
  *   `_getMatchedHobby (user: User): (hobby: String)[]`
    *   **requires**: The `user` exists and has at least one `HobbyMatch`.
    *   **effects**: Returns the most recent `matchedHobby` for the `user`.
  *   `_getAllHobbyMatches (user: User): (match: { id: ID, hobby: String, matchedAt: DateTime })[]`
    *   **requires**: The `user` exists and has at least one `HobbyMatch`.
    *   **effects**: Returns all hobby matches for the user, most recent first.


```typescript
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
   * Helper: Validate if a given question ID exists in our hardcoded list.
   * @returns The HardcodedQuestion object if found, otherwise undefined.
   */
  public getQuestionById(questionId: Question): HardcodedQuestion | undefined {
    return QUIZ_QUESTIONS.find((q) => q._id === questionId);
  }

  /**
   * Action: Generates a hobby match for a user based on their quiz responses using an LLM.
   *
   * @param user - The user taking the quiz
   * @param answers - Array of 5 answer strings, in order of QUIZ_QUESTIONS
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
      console.error("LLM Generation Error:", llmError);
      return {
        error: `Failed to generate hobby match with LLM: ${
          llmError instanceof Error ? llmError.message : "Unknown LLM error"
        }`,
      };
    }
  }

  /**
   * Query: Retrieves the matched hobby for a specific user.
   *
   * @returns An array containing an object with the matched hobby string, or an error message.
   *
   * @requires The `user` exists and has a `HobbyMatch`.
   * @effects Returns the `matchedHobby` for the `user`.
   */
  /**
   * Query: Retrieves all hobby matches for a specific user, most recent first.
   * @returns Array of matches with hobby and timestamp, or error if none found.
   */
  async _getAllHobbyMatches(
    { user }: { user: User },
  ): Promise<{ hobby: string; matchedAt: Date }[] | { error: string }> {
    const matches = await this.hobbyMatches.find({ user }).sort({
      matchedAt: -1,
    }).toArray();
    if (!matches.length) {
      return { error: `No hobby matches found for user ${user}.` };
    }
    return matches.map((m) => ({
      id: m._id,
      hobby: m.matchedHobby,
      matchedAt: m.matchedAt,
    }));
  }

  /**
   * Query: Retrieves the most recent hobby match for a specific user.
   * @returns The latest matched hobby, or error if none found.
   */
  async _getMatchedHobby(
    { user }: { user: User },
  ): Promise<{ hobby: string }[] | { error: string }> {
    const match = await this.hobbyMatches.find({ user }).sort({ matchedAt: -1 })
      .limit(1).toArray();
    if (!match.length) {
      return { error: `No hobby match found for user ${user}.` };
    }

    return [{ hobby: match[0].matchedHobby }];
  }

  /**
   * Action: Deletes all hobby matches for a user (to allow a full reset).
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
}
```