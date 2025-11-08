# Final Design Document (Assignment 4c) 

This document summarizes in 2 pages the final design of the HobbySprout backend. The final design differs significantly from the initial plan in [assignment 2](https://github.com/gloriapul/61040-portfolio/blob/main/assignments/assignment2.md). 

## General Changes Summary

Throughout my time working on this project, it went through many changes but the heart of it stayed the same. I got rid of a big feature, Communities, that I had initially envisioned for my application. Including it would have meant having a tracker app, quiz app, and social media app all in one, eliminating the final part made it more focused and realistic in terms of deadlines. In a way, the social media aspect could have also introduced distractions that may have taken away from the user's point for joining which was to stay on track with their hobbies, not an application that helps you find people to do hobbies with. 

I stayed true to the initial design I sketched. My final version also has a dashboard, same navigation header at top, and similar setup overall. I added in some more separation from the milestones page specifically though by having goal history and hobby navigation in the profile page. I also then added the quiz match history in the profile as well, which was a central place for the user to checkout and keeps a sustainable amount of information on each page. I also aimed to make the page welcoming and related to the name, Hobby Sprout, which makes users think of nature, which is why I had a generally green color scheme. 

Overall, my final design is significantly more focused. The addition of new queries and syncs added a lot to the application as well. My decisions such as the ones mentioned in the next section were made with a potential user in mind. I aimed to make it easy for a user to work on their hobby and stay accountable. I have listed below major specific changes. 

## Key Changes

**1. Dropped `Communities` Concept:**
- Explained above

**2. Enhanced Security in `PasswordAuthentication`:**
- **Initial:** The concept simply mentioned just storing a `password`.
- **Final:** My implementation now uses secure password hashing. Passwords are not stored, which is a critical and good security practice that was not specified in the original assignment 2 design. 

**3. Refined `UserProfile` Concept:**
- **Initial:** The concept included an `active status` to manage whether a user's profile was "closed."
- **Final:** The `active status` was removed. A user's profile is considered active as long as it exists. Closing a profile is now a more definitive action that deletes the user's data, triggered by a secure, backend-to-backend sync after a user deletes their authentication account. This backend sync took many hours in particular to debug and think through. 

**4. Matured `MilestoneTracker` Concept:**
- **Initial:** The concept was vaguely defined with `goals` and `steps` as simple `Strings` and actions that were not tied to a specific user.
- **Final:** The concept is now modeled with `Goal` and `Step` documents. A key feature, the `autoGenerate` flag, was added to the `createGoal` action. This allows the frontend to control whether the LLM should automatically generate steps upon goal creation, providing more flexibility to the user journey in their decision to manually enter steps or generate them. Overall, this concept is much more organized now.

**5. Security Overall:**
- **Initial:** Security was not deeply considered in assignment 2. 
- **Final:** The syncs lecture helped greatly with thinking through security. I kept in mind security as a whole, looking at when session ids and user ids should be used, as well as thinking through included and excluded routes. The most significant change was requiring a backend-verified `session` parameter for all data-modifying actions.

**6. UI/UX Focus:**
- **Initial:** Made basic sketches of the UI
- **Final:** A summary of the changes is mentioned in the previous section but overall, I learned a lot about UI/UX tips and tricks through my lecture, visual study, and research. Choices, such as having a hobby history page and allowing regenerating of things including steps and quiz matches, were crucial for the user experience. I thought of users on their computers and how the locations of elements could be best placed such as the information on the dashboard. 

**7. Logout:**
- **Initial:** No consideration of logout
- **Final:** The conceptbox repo was a helpful reference since it made me think about logging out. I introduced the sync to make it clear how the logout process works. It should delete the session token from the backend database to protect the user.
