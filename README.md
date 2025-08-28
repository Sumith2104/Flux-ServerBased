# Spreadsheet AI Project

This is a Next.js application built with ShadCN UI, Tailwind CSS, and Genkit for AI-powered features. It allows users to manage projects, create tables, and interact with data using natural language queries.

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Install Dependencies

Open your project terminal and install the required npm packages:

```bash
npm install
```

### 2. Set Up Environment Variables

The project uses Google's Gemini models for its AI features, which requires an API key.

1.  Create a new file named `.env` in the root of your project.
2.  Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
3.  Add the API key to your `.env` file like this:

```
GEMINI_API_KEY=your_api_key_here
```

### 3. Run the Development Servers

This project requires two separate terminal sessions to run concurrently: one for the Next.js application and one for the Genkit AI server.

**In your first terminal**, run the Next.js development server:

```bash
npm run dev
```

This will start the main application, typically on `http://localhost:9002`.

**In your second terminal**, run the Genkit development server:

```bash
npm run genkit:dev
```

This starts the Genkit server that handles all AI-related tasks.

### 4. Access the Application

Once both servers are running, you can open your web browser and navigate to `http://localhost:9002` to use the application.

## Available Scripts

- `npm run dev`: Starts the Next.js application in development mode.
- `npm run genkit:dev`: Starts the Genkit server for AI flows.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts a production server.
- `npm run lint`: Lints the project files.
- `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
