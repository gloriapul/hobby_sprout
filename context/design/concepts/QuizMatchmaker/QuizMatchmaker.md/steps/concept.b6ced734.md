---
timestamp: 'Fri Oct 17 2025 00:35:18 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_003518.c17e33e4.md]]'
content_id: b6ced734e9d8cb390f8e230fa7aa6725fa5f822803c37fbe5c7b67345030de64
---

# concept: QuizMatchmaker (Hardcoded Questions)

* **concept**: QuizMatchmaker \[User]
* **purpose**: To match users with suitable hobbies based on their responses to a *predefined, fixed* quiz, leveraging an LLM for intelligent matching.
* **principle**: If a user provides answers to all predefined quiz questions, then the system will use an AI (LLM) to analyze these responses and suggest a specific hobby that aligns with the user's interests, which the user can then view.
* **Notes**: The quiz questions are inherent to the concept's definition and are not managed through actions. They are fixed and cannot be added, removed, or modified after deployment.
* **state**:
  * A set of `UserResponses` with
    * a `user` of type `User`
    * a `question` of type `Question` (referencing a predefined question ID)
    * an `answerText` of type `String`
  * A set of `HobbyMatches` with
    * a `user` of type `User`
    * a `matchedHobby` of type `String`
    * a `matchedAt` of type `DateTime`
* **actions**:
  * `submitResponse (user: User, question: Question, answerText: String)`
    * **requires**: The `question` ID must correspond to one of the predefined questions. The `user` has not yet submitted a response for this specific `question`.
    * **effects**: Records the `user`'s `answerText` for the given `question`.
  * `updateResponse (user: User, question: Question, newAnswerText: String)`
    * **requires**: The `question` ID must correspond to one of the predefined questions. The `user` has already submitted a response for this specific `question`. No `HobbyMatch` exists for this `user`.
    * **effects**: Updates the `user`'s `answerText` for the given `question`.
  * `generateHobbyMatch (user: User): (matchedHobby: String)`
    * **requires**: The `user` has submitted responses for *all* predefined `Questions`. No `HobbyMatch` already exists for this `user`.
    * **effects**: Uses an LLM to analyze the `user`'s `UserResponses` to `Questions`, generates a `matchedHobby` string, stores it, and returns it.
* **queries**:
  * `_getQuestions (): (question: { _id: Question, text: String, order: Number })[]`
    * **requires**: true
    * **effects**: Returns an array of all *predefined* quiz questions, ordered by `order`.
  * `_getUserResponses (user: User): (response: { question: Question, answerText: String })[]`
    * **requires**: The `user` exists.
    * **effects**: Returns all `UserResponses` submitted by the `user`.
  * `_getMatchedHobby (user: User): (hobby: String)[]`
    * **requires**: The `user` exists and has a `HobbyMatch`.
    * **effects**: Returns the `matchedHobby` for the `user`.
