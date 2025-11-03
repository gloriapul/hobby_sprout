# Test Results for UserProfile Concept

Principle: User creates profile, adds personal information ...
------- output -------
1. Creating a new user profile
   ✓ Profile created successfully for user: user:Alice
2. Setting display name for the profile
   ✓ Display name set to "HobbyEnthusiast"
3. Setting profile image for the profile
   ✓ Profile image set successfully
4. Verifying user profile information
   ✓ Profile verification successful: User has correct name and image
5. Principle satisfied: User profile created and information is visible
----- output end -----
Principle: User creates profile, adds personal information ... ok (876ms)
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
Action: setHobby/closeHobby manages hobby assignments and status ... ok (944ms)
Action: createProfile/deleteProfile enforces profile uniqueness and lifecycle ...
------- output -------
1. Creating a user profile
   ✓ Profile created successfully for user: user:Alice
2. Testing profile uniqueness - attempting to create duplicate profile
   ✓ Duplicate profile correctly rejected with error: "Profile for user user:Alice already exists."
3. Deleting the user profile
   ✓ Profile deleted successfully
4. Verifying profile is permanently removed
   ✓ Profile verified as permanently removed
5. Action requirements satisfied: Profile creation enforces uniqueness and profiles can be deleted
----- output end -----
Action: createProfile/deleteProfile enforces profile uniqueness and lifecycle ... ok (779ms)
Action: deleteProfile permanently removes profile and associated data ...
------- output -------
1. Creating a user profile with hobbies
   ✓ Profile created with name and 2 hobbies
2. Verifying profile and hobbies exist
   ✓ Profile and 2 hobbies verified
3. Deleting the user profile
   ✓ Profile deleted successfully
4. Verifying profile and hobbies are permanently removed
   ✓ Profile and all associated data permanently removed
5. Attempting to delete non-existent profile
   ✓ Correctly rejected with error: "User profile for user:Alice not found."
6. Action requirements satisfied: deleteProfile removes all user data permanently
----- output end -----
Action: deleteProfile permanently removes profile and associated data ... ok (1s)

ok | 4 passed | 0 failed (3s)

## Summary
- Profile creation and closure works with proper uniqueness validation
- Personal information (display name, profile image) is correctly managed
- Hobby assignment system handles addition, duplicates, and status changes
- All queries return correct profile information for other users to see
