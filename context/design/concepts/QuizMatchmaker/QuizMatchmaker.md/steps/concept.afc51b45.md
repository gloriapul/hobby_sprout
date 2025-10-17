---
timestamp: 'Fri Oct 17 2025 00:32:26 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_003226.80758401.md]]'
content_id: afc51b450d6aa8efa95de2cd8ad39f7ed10b6755cd569fa1703bbd3ff2e9c9ea
---

# concept: QuizMatchmaker

* **concept**: QuizMatchmaker \[User]
* **purpose**: To match users with suitable hobbies based on their responses to a predefined quiz, leveraging an LLM for intelligent matching.
* **principle**: If a user provides answers to all predefined quiz questions, then the system will use an AI (LLM) to analyze these responses and suggest a specific hobby that aligns with the user's interests, which the user can then view.
* **state**:
  * A set of `Questions` with
    * a `text` of type `String`
    * an `order` of type `Number` (unique for each question)
  * A set of `UserResponses` with
    * a `user` of type `User`
    * a `question` of type `Question`
    * an `answerText` of type `String`
  * A set of `HobbyMatches` with
    * a `user` of type `User`
    * a `matchedHobby` of type `String`
    * a `matchedAt` of type `DateTime`
* **actions**:
  * `addQuestion (text: String, order: Number): (question: Question)`
    * **requires**: No other question with the same `order` already exists.
    * **effects**: A new question is added to the quiz with the specified text and order.
  * `submitResponse (user: User, question: Question, answerText: String)`
    * **requires**: The `question` exists. The `user` has not yet submitted a response for this specific `question`.
    * **effects**: Records the `user`'s `answerText` for the given `question`.
  * `updateResponse (user: User, question: Question, newAnswerText: String)`
    * **requires**: The `question` exists. The `user` has already submitted a response for this specific `question`. No `HobbyMatch` exists for this `user`.
    * **effects**: Updates the `user`'s `answerText` for the given `question`.
  * `generateHobbyMatch (user: User): (matchedHobby: String)`
    * **requires**: The `user` has submitted responses for all currently defined `Questions`. No `HobbyMatch` already exists for this `user`.
    * **effects**: Uses an LLM to analyze the `user`'s `UserResponses` to `Questions`, generates a `matchedHobby` string, stores it, and returns it.
* **queries**:
  * `_getQuestions (): (question: {id: Question, text: String, order: Number})[]`
    * **requires**: true
    * **effects**: Returns an array of all defined quiz questions, ordered by `order`.
  * `_getUserResponses (user: User): (response: {question: Question, answerText: String})[]`
    * **requires**: The `user` exists.
    * **effects**: Returns all `UserResponses` submitted by the `user`.
  * `_getMatchedHobby (user: User): (hobby: String)[]`
    * **requires**: The `user` exists and has a `HobbyMatch`.
    * **effects**: Returns the `matchedHobby` for the `user`.
