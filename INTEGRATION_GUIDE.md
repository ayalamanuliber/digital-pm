# Integration Guide

## How to Provide Sections for Integration

### Format for Sharing Code

When you're ready to integrate a section, provide:

1. **Clear Section Name/Description**
   - What feature/section is this?
   - What does it do?

2. **All Code Files**
   - Components
   - API routes
   - Types/Interfaces
   - Utilities
   - Styles (if any custom CSS)

3. **Dependencies (if any)**
   - New npm packages needed
   - External APIs or services

4. **Integration Notes**
   - Where should this live in the project?
   - Any special setup required?
   - Environment variables needed?

### Example Submission

```markdown
## Section: User Authentication

### Description
Complete user authentication system with login, signup, and protected routes.

### Files

**Component: /components/features/auth/LoginForm.tsx**
[your code here]

**API Route: /app/api/auth/login/route.ts**
[your code here]

**Types: Add to /types/index.ts**
[your types here]

### Dependencies
- bcryptjs
- jsonwebtoken

### Integration Notes
- Needs DATABASE_URL environment variable
- Protected routes should use the authMiddleware from lib/auth.ts
```

## What I'll Do

1. ✅ Review your code for consistency
2. ✅ Place files in proper locations
3. ✅ Install any needed dependencies
4. ✅ Update TypeScript types/interfaces
5. ✅ Ensure imports use correct paths (@/ alias)
6. ✅ Test that everything integrates properly
7. ✅ Update documentation if needed
8. ✅ Flag any issues or suggest improvements

## Questions to Ask Before Starting a Section

- "Where should the [feature name] components live?"
- "What naming convention should I use for [X]?"
- "Should I create a new API route or extend existing ones?"
- "What TypeScript interfaces exist that I can reuse?"

---

Ready when you are! 🎯
