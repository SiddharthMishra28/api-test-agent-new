# AI API Tester Usage Guide

This guide will walk you through setting up and using the AI API Tester application.

## Prerequisites

- Node.js (v18 or higher)
- npm

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd ai-api-tester
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following:
    ```
    OPENAI_API_KEY=your_openai_api_key_here
    ```

## Running the Application

1.  **Start the server:**
    ```bash
    npm run dev
    ```
    The server will be running at `http://localhost:3000`.

2.  **Open the application in your browser:**
    Navigate to `http://localhost:3000` to access the web interface.

## How to Use

1.  **Upload an OpenAPI Specification (Optional):**
    - Click the "Choose File" button to select an OpenAPI/Swagger specification file (in YAML or JSON format).
    - If you don't provide a spec, the AI will generate a test case based solely on your instruction.

2.  **Provide a Test Instruction:**
    - In the "Test Instruction" text area, enter a natural language instruction for the test you want to run.
    - For example: `Test the POST /users endpoint. It should return a 201 status code on success and a 400 status code if the email is missing.`

3.  **Run the Test:**
    - Click the "Run Test" button to start the test.
    - The application will generate a test case, execute it, and display the results.

4.  **View the Report:**
    - Once the test is complete, a link to the HTML report will be provided.
    - Click the link to view a detailed report of the test run, including the request and response for each step, and the results of the assertions.
