# P.T.S. Allowance Management System

This is a web application for managing special position allowances for public health personnel. It is built with Next.js, TypeScript, and Tailwind CSS, and uses a MySQL database for data storage.

## Features

- **User Authentication:** Secure login system for authorized personnel.
- **Allowance Management:** Create, read, update, and delete allowance records.
- **Data Visualization:** View allowance data with interactive charts.
- **Responsive Design:** The application is optimized for both desktop and mobile devices.

## Technologies Used

- **Framework:** [Next.js](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Shadcn/UI](https://ui.shadcn.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Database:** [MySQL](https://www.mysql.com/)
- **Authentication:** [JSON Web Tokens (JWT)](https://jwt.io/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later)
- npm, pnpm, or yarn
- MySQL

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/pts-allowance-management.git
   cd pts-allowance-management
   ```

2. **Install dependencies:**
   ```sh
   pnpm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add the following variables:

   ```env
   # Database configuration
   DB_HOST=your-db-host
   DB_PORT=your-db-port
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=your-db-name

   # JWT secret for authentication
   JWT_SECRET=your-jwt-secret
   ```

4. **Run the development server:**
   ```sh
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`.

## Project Structure

- **/app:** Contains the main application pages and layouts.
- **/components:** Reusable React components.
- **/lib:** Utility functions and database connection setup.
- **/public:** Static assets like images and fonts.
- **/styles:** Global CSS styles.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
