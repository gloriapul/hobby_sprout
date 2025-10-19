# Test Results for UserProfile Concept

Principle: User creates profile, adds personal information, and other users can see it ...
------- output -------
1. Creating a new user profile
   ✓ Profile created successfully for user: user:Alice
2. Setting display name for the profile
   ✓ Display name set to "HobbyEnthusiast"
3. Setting profile image for the profile
   ✓ Profile image set successfully
4. Verifying user profile information
   ✓ Profile verification successful: User has correct name, image, and active status
5. Principle satisfied: User profile created and information is visible
----- output end -----
Principle: User creates profile, adds personal information, and other users can see it ... ok (720ms)
Action: setHobby/closeHobby manages hobby assignments and status ...
------- output -------
1. Creating a profile for hobby management
   ✓ Profile created successfully for user: user:Alice
2. Adding a hobby to the user profile
   ✓ Hobby "Photography" added successfully
3. Testing hobby uniqueness - attempting to add same hobby again
   ✓ Duplicate hobby correctly rejected with error: "Hobby 'Photography' is already active for user user:Alice."
4. Closing a hobby
   ✓ Hobby "Photography" closed successfully
5. Action requirements satisfied: setHobby and closeHobby work correctly with proper validation
----- output end -----
Action: setHobby/closeHobby manages hobby assignments and status ... ok (791ms)
Action: createProfile/closeProfile enforces profile uniqueness and lifecycle ...
------- output -------
1. Creating a user profile
   ✓ Profile created successfully for user: user:Alice
2. Testing profile uniqueness - attempting to create duplicate profile
   ✓ Duplicate profile correctly rejected with error: "Profile for user user:Alice already exists."
3. Closing the user profile
   ✓ Profile closed successfully
4. Verifying profile inactive status
   ✓ Profile verified as inactive
5. Action requirements satisfied: Profile creation enforces uniqueness and profiles can be closed
----- output end -----
Action: createProfile/closeProfile enforces profile uniqueness and lifecycle ... ok (708ms)

ok | 3 passed | 0 failed (2s)

## Summary
- Profile creation and closure works with proper uniqueness validation
- Personal information (display name, profile image) is correctly managed
- Hobby assignment system handles addition, duplicates, and status changes
- All queries return correct profile information for other users to see
