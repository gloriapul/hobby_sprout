---
timestamp: 'Fri Oct 17 2025 00:34:03 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_003403.ca79daaf.md]]'
content_id: e1a13170db088d8768668207edacabc3ef68ccd2ed6a0bd76e5a44b30ecbd95d
---

# response:

You've raised an excellent point! The current `addQuestion` action in the `QuizMatchmaker` concept implies that users (or the application dynamically) can define new questions, which contradicts the idea of a fixed, pre-set quiz.

The principle of Concept Design states that the actions define the *capability* of the concept. Who can trigger those actions (end-users, administrators, other concepts via syncs) is determined by the `sync` rules, which are external to the concept definition itself.

However, to align with your feedback that "the questions asked for each question will be the SAME" and are "hardcoded" (meaning, pre-defined and not modifiable by the end-user taking the quiz), we should clarify the role of the `addQuestion` action. It serves as an **administrative setup** action to initially define the quiz structure within the concept's state. It's not for end-users to create questions.

Here's the updated `QuizMatchmaker` concept, focusing on clarifying the intent of `addQuestion` and refining the query outputs for consistency:
