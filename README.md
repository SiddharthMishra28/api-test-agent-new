# AI API Tester

Welcome to the AI API Tester! This project is a powerful, AI-driven tool that allows you to test your APIs using plain English. Simply describe the tests you want to run, and the AI will handle the rest, from generating the test cases to executing them and providing a detailed report.

This guide is designed for absolute beginners, so don't worry if you're new to API testing or AI. We'll walk you through everything step-by-step.

## ✨ Features

-   **Natural Language Testing:** Write test instructions in plain English, like you're talking to a human.
-   **AI-Powered Test Generation:** Uses the power of OpenAI's GPT models to automatically create test cases from your instructions.
-   **OpenAPI/Swagger Support:** (Optional) Provide your API's specification file to help the AI generate more accurate and context-aware tests.
-   **Comprehensive Assertions:** The AI can test for a wide range of conditions, including:
    -   Status codes (e.g., `200 OK`, `404 Not Found`)
    -   Response times
    -   JSON schema validation
    -   Specific values in the response body (using JSONPath)
    -   Headers
-   **Detailed HTML Reports:** Get a beautiful, easy-to-read HTML report for each test run, complete with request and response details for every step.
-   **Simple Web Interface:** A clean and simple web interface to run your tests, with no complex setup required.

## 🚀 Getting Started

Follow these steps to get the AI API Tester up and running on your local machine.

### Prerequisites

Before you begin, make sure you have the following installed:

-   **Node.js:** You'll need a recent version of Node.js (v18 or higher). You can download it from the [official Node.js website](https://nodejs.org/).
-   **npm:** This is the package manager for Node.js and is usually installed automatically with Node.js.

### Installation

1.  **Clone the Repository:**
    First, you'll need to get the code. You can do this by cloning the repository using Git. If you don't have Git, you can download the code as a ZIP file.

    ```bash
    git clone <repository-url>
    cd ai-api-tester
    ```

2.  **Install Dependencies:**
    Next, you'll need to install all the packages that the project depends on. Run the following command in your terminal:

    ```bash
    npm install
    ```
    This will create a `node_modules` directory with all the necessary packages.

3.  **Set Up Your Environment Variables:**
    The application needs an OpenAI API key to work. You'll need to create a `.env` file to store this key securely.

    -   Create a new file named `.env` in the root of the project.
    -   Add the following line to the file, replacing `your_openai_api_key_here` with your actual OpenAI API key:

        ```
        OPENAI_API_KEY=your_openai_api_key_here
        ```

### Running the Application

Now you're ready to start the application!

1.  **Start the Server:**
    Run the following command in your terminal:

    ```bash
    npm run dev
    ```
    You should see a message indicating that the server is running, like this:
    `{"timestamp":"...","level":"info","message":"Server listening on port 3000"}`

2.  **Open the Application in Your Browser:**
    Open your web browser and navigate to `http://localhost:3000`. You should see the AI API Tester interface.

## 📝 How to Use

Here's how to run your first test.

### Without an OpenAPI Specification

1.  **Write Your Instruction:**
    In the "Test Instruction" text area, describe the test you want to run. Be as specific as you can.

    **Example:**
    ```
    Generate a test for the endpoint https://jsonplaceholder.typicode.com/posts/1. The test should verify that the status code is 200 and that the response body contains a 'title' field.
    ```

2.  **Run the Test:**
    Click the "Run Test" button. You'll see a "Running test..." message while the AI generates and executes the test.

3.  **View the Results:**
    Once the test is complete, you'll see a summary of the results and a link to the full HTML report.

### With an OpenAPI Specification

Providing an OpenAPI (or Swagger) specification can help the AI generate more accurate and detailed tests.

1.  **Upload Your Spec File:**
    Click the "Choose File" button and select your OpenAPI specification file (it can be in YAML or JSON format).

2.  **Write Your Instruction:**
    Now, you can write an instruction that refers to the endpoints in your spec file.

    **Example:**
    If your spec file has an endpoint for `POST /users`, you could write:
    ```
    Test the POST /users endpoint. The test should check for a 201 status code on success and a 400 status code if the 'email' field is missing.
    ```

3.  **Run the Test and View the Results:**
    The process is the same as before. The AI will use the context from your spec file to generate the test case.

## 📂 Project Structure

Here's a quick overview of the key files and directories in the project:

```
.
├── .github/workflows/ci.yml  # GitHub Actions workflow for automated testing
├── docs/usage.md             # Usage documentation
├── public/index.html         # The simple custom frontend
├── src/
│   ├── agents/mainAgent.ts   # The main AI agent that orchestrates the testing process
│   ├── tools/                # The core tools that the agent uses
│   │   ├── assertionEngine.ts
│   │   ├── httpExecutor.ts
│   │   ├── openApiParser.ts
│   │   ├── reporter.ts
│   │   └── testCaseGenerator.ts
│   ├── utils/                # Utility functions and type definitions
│   │   ├── logger.ts
│   │   └── types.ts
│   └── server.ts             # The Express server and API endpoints
├── templates/report.ejs      # The template for the HTML report
├── tests/                    # Unit and integration tests
│   └── unit/
├── .env.example              # An example of the .env file
├── package.json              # Project dependencies and scripts
└── README.md                 # This file
```

## 🛠️ Technical Details

-   **Backend:** The backend is built with **Node.js** and **Express**, providing a fast and reliable server.
-   **AI Integration:** The application uses the **OpenAI API** to send prompts to the **GPT-4o** model, which generates the test cases.
-   **API Testing Tools:**
    -   **axios:** Used to make the HTTP requests to the APIs being tested.
    -   **ajv:** Used for JSON schema validation.
    -   **jsonpath-plus:** Used to query and assert on specific values in JSON responses.
-   **Reporting:** The HTML reports are generated using **EJS (Embedded JavaScript templates)**, which allows for dynamic and flexible report layouts.

## 🧪 Running the Tests

The project has a comprehensive suite of automated tests. To run them, use the following command:

```bash
npm test
```
This will run all the unit and integration tests and provide a summary of the results.
