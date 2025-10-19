# HobbySprout Design Changes

This document reflects on the key design changes made to the HobbySprout application during implementation, along with interesting moments from my development process.

## Overall Design Changes

I made two big changes compared to Assignment 2 that helped make the focus of HobbySprout more clear and realistic for the project time given. I swapped out one of my concepts, Communities, for a concept called QuizMatchmaker. The Communities concept was intended to offer a hobby group forum where users could make comments, which was intended to help users stay on track for accomplishing their goal. Based on feedback, I removed it as it was making the scope of HobbySprout too large for the project time given by having a social media app, task tracker app, quiz app, and recommendation app all in one. So, I eliminated it and I added QuizMatchmaker as it was necessary to ensure it had its own concept. Originally, I just briefly mentioned having a quiz in one of the actions for MilestoneTracker but based on feedback, it also became clear to me that I had to have its own concept. This cleaned up my code significantly since having the quiz in the other concept would have cluttered MilestoneTracker too much and taken away from its sole focus of generating steps.

Another smaller change to my design application was adding more actions since that gives a user more freedom and can keep them interested if they can do more. That included having a delete step action since it was crucial to have some kind of 'undo' there. Overall, my design became more focused and organized. The syncs to be added in future assignments will show how the concepts can interact in a helpful manner with each other. 


## Interesting Development Moments

### 1. Remove Action Added in MilestoneTracker

[Remove Step Action](../context/design/concepts/MilestoneTracker/testing.md/steps/_.f9b28954.md)

This moment marks a moment where I opted to add a remove step action. I realized that if a user wants to add something but they do it mistakenly, then they should be able to just delete it. This makes the app more usable since if it were the case where many steps were added mistakenly or Gemini generated far too many steps for a user, then the clutter would be huge in the user's view. So, having a delete step was an important and interesting moment since it made me think more about the use cases and implications of not having the action. 

### 2. Improving Tests for QuizMatchmaker

[Improved Tests](../context/design/concepts/QuizMatchmaker/testing.md/steps/file.05b00ac0.md)

Throughout my testing process for the QuizMatchmaker, I noticed that the file was just getting longer and longer and not all of it was needed. This led me to shorten many lines and add two small helper functions as a way to promote more reusability of code. This moment made me think more about making code more readable for others. They are small steps that I can take to make a difference in the code, which made it an interesting moment for me in my development of the application. 

### 3. Validating Hobbies from the QuizMatchmaker

[Sanitizing Hobby Name](../context/design/concepts/QuizMatchmaker/QuizMatchmaker.md/steps/file.f55a26fb.md)

As I was working on the QuizMatchmaker, I also realized that it was missing some other work, specifically the validation for hobbies after they are generated. In my MilestonesTracker concept which I finished up before this one and was the one I worked on in assignment 3, I did have checks for the content that Gemini would produce. I realized that it would be beneficial in this concept as well after one of my tests failed due to an issue with the structure of the response from Gemini. So, this moment made me think about what LLMs produce and how as a developer I can add small checks so that it makes it much less likely a user would see this kind of error message if they're using my application. The snapshot is from when I just had a line that did a trim. 

### 4. Comparisons MilestoneTracker

[Comparisons](../context/src/concepts/MilestoneTracker/MilestoneTrackerConcept.ts/steps/response.ccbdf1dc.md)

This moment was interesting for me since it made me think about the differences between implementations of my concept. The Context tool was useful for clarifying these differences to me in an easy to read format. It made think about how different implementations had different benefits and which would be better in my application. 

### 5. Gemini Correction

[Correction](../context/src/concepts/MilestoneTracker/MilestoneTrackerConcept.ts/steps/response.631c0c71.md)

This moment was interesting for me since the Context tool corrected me. I had put something that did not really make sense in my question and Gemini was quick to correct me on that. I found it interesting how it then pointed out that it removed an unnecessary import. It made me think about different responses I've gotten from LLM responses before and how they always try to come up with something actionable to do. This made me consider my future questions I could ask for the development of my application. 
