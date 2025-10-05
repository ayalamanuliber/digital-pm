# PM Build - Project Management Application

## Overview
This is a TypeScript + Next.js project for building a project management application.

## Project Workflow

### Integration Process
This project follows a **section-by-section integration workflow**:

1. **You prepare each section** - Work on individual features/sections outside this codebase
2. **Provide the section to Claude** - Share your completed work (components, logic, APIs, etc.)
3. **Claude integrates it** - I'll properly integrate your work into the project structure
4. **Ensure consistency** - I'll maintain code consistency, proper typing, and ensure everything works together

### Claude's Responsibilities
- ✅ Integrate provided sections into the proper project structure
- ✅ Maintain consistency across the entire codebase
- ✅ Ensure TypeScript types are properly defined
- ✅ Make sure components are easy to plug in and reuse
- ✅ Verify APIs are properly exposed and documented
- ✅ Handle proper error handling and edge cases
- ✅ Keep the architecture clean and maintainable
- ✅ Ensure no conflicts between different sections

### Project Standards

#### Code Consistency
- **TypeScript**: Strict mode enabled, full type coverage
- **Component Structure**: Functional components with proper prop typing
- **Naming Conventions**: camelCase for variables/functions, PascalCase for components
- **File Organization**: Feature-based folder structure

#### API Standards
- **RESTful endpoints**: Clear naming and proper HTTP methods
- **Type-safe responses**: All API responses are typed
- **Error handling**: Consistent error response format
- **Documentation**: Each API endpoint documented

#### Component Standards
- **Reusability**: Components designed to be easily plugged in
- **Props Interface**: Every component has a defined TypeScript interface
- **Documentation**: JSDoc comments for complex logic
- **Testing**: Unit tests for critical components

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Package Manager**: npm

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## Project Structure
```
PM Build/
├── app/                  # Next.js app directory
│   ├── api/             # API routes
│   ├── (routes)/        # Application routes
│   └── layout.tsx       # Root layout
├── components/          # Reusable components
│   ├── ui/             # UI components
│   └── features/       # Feature-specific components
├── lib/                # Utilities and helpers
├── types/              # TypeScript type definitions
└── public/             # Static assets
```

## Development Notes

### When Integrating New Sections
1. Place components in the appropriate feature folder
2. Define TypeScript interfaces in `/types`
3. Create API routes in `/app/api` if needed
4. Update this README if new patterns are introduced
5. Ensure all imports use the `@/` alias

### Questions Before Starting?
If you have any questions about:
- Where a section should be integrated
- How to structure your work before bringing it
- What format to provide your code in
- Any architectural decisions

Feel free to ask before you start working on a section!

---

**Ready for your first section!** 🚀

---

## Next.js Documentation

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Learn More
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
