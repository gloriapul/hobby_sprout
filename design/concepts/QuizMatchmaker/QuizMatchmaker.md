[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

[@likert](../LikertSurvey/implementation.md)

# implement: QuizMatchmaker.

# response:

*   **concept**: QuizMatchmaker \[User]
*   **purpose**: To match users with suitable hobbies based on their responses to a *predefined, fixed* quiz.
*   **principle**: If a user provides answers to all predefined quiz questions, then the system will use an LLM to analyze these responses and suggest a specific hobby that aligns with the user's interests, which the user can then view.
*   **state**:
    *   A set of `UserResponses` with
        *   a `user` of type `User`
        *   a `question` of type `Question` (referencing a predefined question ID)
        *   an `answerText` of type `String`
    *   A set of `HobbyMatches` with
        *   a `user` of type `User`
        *   a `matchedHobby` of type `String`
        *   a `matchedAt` of type `DateTime`
*   **actions**:
    *   `submitResponse (user: User, question: Question, answerText: String)`
        *   **requires**: The `question` ID must correspond to one of the predefined questions. The `user` has not yet submitted a response for this specific `question`.
        *   **effects**: Records the `user`'s `answerText` for the given `question`.
    *   `updateResponse (user: User, question: Question, newAnswerText: String)`
        *   **requires**: The `question` ID must correspond to one of the predefined questions. The `user` has already submitted a response for this specific `question`. No `HobbyMatch` exists for this `user`.
        *   **effects**: Updates the `user`'s `answerText` for the given `question`.
    *   `generateHobbyMatch (user: User): (matchedHobby: String)`
        *   **requires**: The `user` has submitted responses for *all* predefined `Questions`. No `HobbyMatch` already exists for this `user`.
        *   **effects**: Uses an LLM to analyze the `user`'s `UserResponses` to `Questions`, generates a `matchedHobby` string, stores it, and returns it.
  *   `deleteHobbyMatch (user: User)`
    *   **requires**: A `HobbyMatch` exists for this `user`.
    *   **effects**: Deletes the existing `HobbyMatch` so the user can update responses and generate a new match.
*   **queries**:
    *   `_getQuestions (): (question: { _id: Question, text: String, order: Number })[]`
        *   **requires**: true
        *   **effects**: Returns an array of all *predefined* quiz questions, ordered by `order`.
    *   `_getUserResponses (user: User): (response: { question: Question, answerText: String })[]`
        *   **requires**: The `user` exists.
        *   **effects**: Returns all `UserResponses` submitted by the `user`.
    *   `_getMatchedHobby (user: User): (hobby: String)[]`
        *   **requires**: The `user` exists and has a `HobbyMatch`.
        *   **effects**: Returns the `matchedHobby` for the `user`.


```typescript
import { Collection, Db } from "mongodb";
import { Empty, ID } from "@utils/types.ts";
import { GeminiLLM } from "@utils/gemini-llm.ts";

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
 * A set of UserResponses, linking a user, a question, and their text answer.
 * Each document represents one user's answer to one specific question.
 */
interface UserResponseDoc {
  _id: ID; // Unique ID for this specific user response entry (using freshID)
  user: User; // The ID of the user who provided the answer
  question: Question; // The ID of the question being answered (references a QUIZ_QUESTIONS._id)
  answerText: string; // The user's free-form text answer
}

/**
 * State:
 * A set of HobbyMatches, storing the matched hobby for each user.
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
  private llm: GeminiLLM | null = null;

  constructor(private readonly db: Db, apiKey?: string) {
    this.userResponses = this.db.collection(PREFIX + "userResponses");
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
    const firstLine = (raw.split(/\r?\n/).find((l) => l.trim().length > 0) || "").trim();
    if (!firstLine) return undefined;

    // strip surrounding backticks or quotes
    let s = firstLine.replace(/^[`'"\s]+|[`'"\s]+$/g, "").trim();

    // remove an optional leading label like "Hobby:" or "Suggested hobby:"
    s = s.replace(/^(suggested\s+hobby|hobby)\s*:\s*/i, "");

    // if multiple suggestions separated by comma or ' and ', pick the first piece
    const splitDelim = s.includes(",") ? "," : (/(\s+and\s+)/i.test(s) ? /\s+and\s+/i : null);
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
   * Action: Allows a user to submit their response to a specific quiz question.
   *
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
    // Validate question ID against hardcoded list
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
   * @returns An object containing the suggested matched hobby string, or an error message.
   *
   * @requires The `user` has submitted responses for all questions. No `HobbyMatch` already exists for this `user`.
   * @effects Uses an LLM to analyze the `user`'s `UserResponses` to `Questions`, generates a `matchedHobby` string, stores it, and returns it.
   */
  async generateHobbyMatch(
    { user }: { user: User },
  ): Promise<{ matchedHobby: string } | { error: string }> {
    const userResponses = await this.userResponses.find({ user }).toArray();
    if (userResponses.length !== QUIZ_QUESTIONS.length) {
      return {
        error:
          `User ${user} has not answered all ${QUIZ_QUESTIONS.length} questions. Please submit responses for all questions.`,
      };
    }

    const existingMatch = await this.hobbyMatches.findOne({ _id: user });
    if (existingMatch) {
      return {
        error:
          `User ${user} already has a generated hobby match: "${existingMatch.matchedHobby}".`,
      };
    }

    // check if LLM is initialized
    if (!this.llm) {
      return {
        error: "LLM not initialized. API key might be missing or invalid.",
      };
    }

    // prep prompt for LLM
    let prompt =
      "Based on the following quiz answers, suggest a single hobby that would best suit the user. Your answer should only be the name of the hobby, e.g., 'Gardening' or 'Photography', and nothing else. Do not include any introductory or concluding remarks, just the hobby name.\n\nQuestions and Answers:\n";
    for (const q of QUIZ_QUESTIONS) {
      const response = userResponses.find((r) => r.question === q._id);
      if (response) {
        prompt += `Q: ${q.text}\nA: ${response.answerText}\n`;
      } else {
        // this case should be prevented by the userResponses.length check, but as a safeguard:
        return { error: `Missing response for question: ${q.text}.` };
      }
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
   * Query: Retrieves all responses submitted by a specific user.
   *
   * @returns An array of response objects, each containing the question ID and the answer text.
   *
   * @requires The `user` exists.
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
   * Action: Deletes an existing hobby match for a user (to allow re-matching).
   *
   * @returns Empty on success or an error string if none existed.
   *
   * @requires A HobbyMatch for `user` exists.
   * @effects Removes the HobbyMatch for `user`, allowing answers to be updated and a new match generated.
   */
  async deleteHobbyMatch(
    { user }: { user: User },
  ): Promise<Empty | { error: string }> {
    const existingMatch = await this.hobbyMatches.findOne({ _id: user });
    if (!existingMatch) {
      return { error: `No hobby match exists for user ${user}.` };
    }
    await this.hobbyMatches.deleteOne({ _id: user });
    return {};
  }
}
```