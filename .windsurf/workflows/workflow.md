---
description: 
---

# P.T.S. Code Review Workflow

This workflow outlines the sequence of tasks the AI must perform to conduct a comprehensive review.

## Phase 1: Codebase Initialization and Analysis

1.  **Read and Understand the Codebase:** Start by traversing the entire project directory. Identify the folder structure, key files (e.g., `next.config.js`, `tsconfig.json`), and the overall architectural layout. Map the relationships between frontend components, API routes, and database interactions.

2.  **Verify Build Process:** Execute a virtual build process to simulate the `npm run build` or `yarn build` command. Check for and log all:
    * Build errors.
    * TypeScript compilation errors.
    * ESLint and Prettier warnings/errors.

## Phase 2: Functional and Architectural Review

3.  **Trace Core Features:** Systematically review the code for each major feature:
    * **Authentication Flow:** Follow the code path for user login (`POST /api/auth/login`). Verify password hashing, JWT generation, cookie handling, and middleware logic.
    * **Submission Form:** Analyze the frontend form code (React Hook Form + Zod) and the corresponding API endpoint (`POST /api/requests`). Check for validation logic on both ends.
    * **Approval Workflow:** Trace the state changes of a request as it moves through the approval stages. Verify that the correct API endpoints (`/approve`, `/reject`, `/override`) are called and that the state transitions are handled correctly in the backend.

4.  **Perform Static Code Analysis:**
    * **TypeScript Review:** Scan the entire codebase for the keyword `any`. For each instance found, create a specific entry in the report explaining why it should be replaced with a more specific type.
    * **Security Review:** Check for potential vulnerabilities, including unvalidated user inputs (e.g., `req.body`), insecure storage of sensitive data, and improper use of JWTs.
    * **Performance Review:** Look for inefficient loops, unoptimized database queries, and unnecessary re-renders in React components.

5.  **UI/UX and Data Flow Review:**
    * **Virtual UI Inspection:** Based on the component code, virtually render and inspect the UI. Identify any components that appear broken, misaligned (using Tailwind classes), or show incomplete data.
    * **Data Consistency:** Verify that data fetched from the API is displayed correctly on the frontend without unexpected formatting or missing information.

## Phase 3: Reporting and Recommendations

6.  **Compile Findings:** Aggregate all identified issues into a single, structured report. Use clear headings for each category (Bugs, Security, TypeScript, UI/UX, etc.).

7.  **Prioritize and Recommend:** Assign a priority level to each finding (Critical, High, Medium, Low). For each item, provide a concrete recommendation for how to fix or refactor the code. Include code snippets where appropriate to demonstrate the proposed solution.