# HobbySprout Design Changes

This document reflects on the key design changes made to the HobbySprout application during implementation since assignment 4b began and ended.

## Overall Design Changes

**1. Refactoring QuizMatchmaker to Batch Model**

The QuizMatchmaker concept was significantly refactored. Originally, I started it out as supporting per-question answer storage and actions (`submitResponse`, `updateResponse`, etc.), but this was replaced with a batch model: users now submit all 5 answers at once, and only the matched hobby is stored. This change simplified the backend, reduced unnecessary state, and made the user experience more streamlined. The API and concept spec were updated to remove all per-question endpoints and actions, and now only batch submission and match history are supported.

**2. Changing the Basis of Quiz Matchmaker**

Originally, users could only receive one match. This, after working on the front end, made it more obvious that that was not helpful or practical for a user since users may want to retake the quiz for multiple reasons, whether it is because they did not like the result or have found that their interests have changed throughout time. So, this was a major change that affected the basis of quiz matchmaker by allowing multiple matches. 

**3. API Specification and Concept Spec Updates**

The API specification was updated to match the new batch model for QuizMatchmaker, removing outdated endpoints and ensuring all endpoints reflect the current implementation. All concept specs were reviewed and updated for consistency with their implementations, including MilestoneTracker and UserProfile. Users also cannot delete any individual hobby matches they get from the quiz matchmaker since that took away from hobby matches being in a user's history. Now, they can only delete all if they want to. 

**4. Test Suite Improvements**

Test files were rewritten to match the new models, especially for QuizMatchmaker. Principle and action/variant tests are now clearly labeled, and all tests print clear, helpful console output. Redundant helpers and legacy logic were removed, and all tests now follow the rubric for operational principle and interesting scenarios. The tests reflect the updated situation of the concept code.

**5. MilestoneTracker: Regenerate Steps and Step Validation Improvements**

The MilestoneTracker concept was enhanced with a `regenerateSteps` action, allowing users to delete all existing steps for a goal and generate a new set of steps using the LLM. So, it can be considered to work as an edit for the steps of the goal. This gets ahead of any potential errors if an initial generate does not work or if the user simply wants to have new steps regenerated. The concept spec, implementation, and tests were updated to reflect this new action and its requirements.

Additionally, the step validation logic was improved to avoid false positives when checking for vague words (e.g., "etc" inside "stretching"), by ensuring only whole words are matched. This makes the validation more robust and prevents valid steps from being incorrectly rejected.
