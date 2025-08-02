{
  "system_info": {
    "name": "Special Position Allowance Management System (P.T.S.)",
    "technologies": ["Next.js", "React", "MySQL", "TypeScript", "JWT", "Tailwind CSS"],
    "features": [
      "User Authentication & RBAC",
      "User Management",
      "Submission Forms with File Uploads",
      "Approval Workflow (Employee -> Supervisor -> HR -> Finance)",
      "Financial Processing & Reporting"
    ],
    "user_context": "The user is an active developer on the project. They admit the code is currently in a 'bad state' and are looking for a complete overhaul based on best practices."
  },
  "user_pain_points": [
    "Code is messy and lacks a clean architecture.",
    "Bugs exist where buttons don't work or UI is misaligned.",
    "Data is not displayed correctly in some UI parts.",
    "They specifically want to remove all instances of the `any` type in TypeScript.",
    "They need verification of the build process and testing coverage."
  ],
  "critical_checks": [
    "Identify any unhandled API errors or broken routes.",
    "Find all instances of `any` and suggest typed alternatives.",
    "Check for any security vulnerabilities in input handling or authentication.",
    "Verify that the entire approval workflow functions correctly from start to finish.",
    "Ensure the build process runs without errors or warnings."
  ]
}