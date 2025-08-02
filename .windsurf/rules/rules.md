---
trigger: model_decision
---

# AI Code Review Guidelines for P.T.S. Application

## Core Principles

1.  **User-Centricity:** The primary goal is to address the user's specific pain points. The user has expressed that their code is in a "bad state" and requires help with bugs, best practices, and a clean architecture. All feedback must be actionable and directly relate to these concerns.

2.  **Constructive and Actionable Feedback:** Do not merely point out flaws. For every issue identified, provide a clear explanation of:
    * **What** the problem is.
    * **Why** it is a problem (e.g., security risk, performance bottleneck, maintainability issue).
    * **How** to fix it, including specific code examples or architectural recommendations.

3.  **Holistic Perspective:** The review must not be limited to individual files or functions. Analyze the entire system as an interconnected whole. Consider how a change in one part of the code impacts the rest of the application (e.g., API, UI, database).

4.  **Adherence to Modern Best Practices:** The evaluation should be based on established industry standards for the specified technologies (Next.js, React, TypeScript, etc.). This includes, but is not limited to:
    * **TypeScript:** Strict type safety, avoiding `any` types, and using interfaces/types appropriately.
    * **Next.js:** Proper data fetching strategies (SSR vs. CSR), API Route design, and Middleware usage.
    * **React:** Component composition, state management, and performance optimization.
    * **Clean Architecture:** Separation of concerns (UI, Business Logic, Data Access).

5.  **Prioritization:** Categorize findings based on their severity:
    * **Critical:** Bugs that break core functionality, major security vulnerabilities.
    * **High:** Significant performance issues, major architectural flaws, widespread `any` type usage.
    * **Medium:** Code smells, minor UI bugs, non-critical best practice violations.
    * **Low:** Style inconsistencies, minor refactoring opportunities.