# Idea Honing

Requirements clarification through Q&A.

---

## Q1: What is the primary purpose of this QA agent?

What specific quality assurance tasks should this agent perform? For example:
- Testing code changes (unit tests, integration tests)
- Reviewing code for bugs/issues
- Validating requirements against implementation
- Automated regression testing
- Test case generation
- Something else?

**Answer:** The agent will:
1. Take an existing codebase, a running service instance, and requirements as input
2. Generate a test plan based on requirements
3. Create an execution plan for running the test plan
4. Execute tests against the running service
5. Also accept code reviews + feature requirements to run the same flow for specific features
6. Allow users to write tests in plain English that are rerunnable later
7. Support AI assertions (LLM-as-judge) for non-deterministic results
8. Mirror real customer interactions with the service
9. Provide rerunnable test plans for ongoing stability as the application evolves

---

## Q2: What type of service/application is this targeting?

Is this QA agent designed for:
- Web applications (REST APIs, GraphQL)
- CLI tools
- UI/frontend applications
- Backend services
- A combination of these
- Agnostic to service type?

**Answer:** Initial prototype targets frontend applications. Design should be extendable to CLI and backend services.

---

## Q3: How should the agent interact with frontend applications?

For testing frontend applications, what interaction method do you envision?
- Browser automation (e.g., Playwright, Puppeteer, Selenium)
- Direct DOM manipulation
- API-level testing of the frontend's backend calls
- Visual/screenshot-based testing
- A combination?

**Answer:** Using rtrvr.ai's Agent API (https://www.rtrvr.ai/docs/agent) and Scrape API (https://www.rtrvr.ai/docs/scrape) for browser interaction.

---

## Q4: What format should the plain English tests be stored in?

You mentioned users can write tests in plain English and rerun them later. How should these be persisted?
- Markdown files
- YAML/JSON configuration files
- Database records
- A custom DSL (domain-specific language)
- Something else?

**Answer:** The initial prompt used to create a test plan only needs to be stored as a property on the overall test plan object.

---

## Q5: What format should the test plan itself be stored in?

The test plan generated from the plain English prompt—how should it be persisted?
- JSON/YAML files
- Markdown
- Database
- In-memory only (regenerated each run)
- Something else?

**Answer:** The test plan will be composed of various step types:
- **Agentic assertions** - for dynamic/non-deterministic assertions (LLM-as-judge)
- **Unit assertions** - for static/deterministic assertions
- **Agentic web browsing** - AI-driven browser interaction (via rtrvr.ai)
- **Selenese web browsing** - scripted browser commands

---

## Q6: How should test plans and results be persisted?

Given the step-based structure, what storage approach do you prefer?
- File-based (JSON/YAML files in a directory structure)
- Database (SQLite, PostgreSQL, etc.)
- Hybrid (files for test plans, database for run results)
- Something else?

**Answer:** File-based using structured JSON files.

---

## Q7: What is the user interface for this agent?

How will users interact with the QA agent?
- CLI tool
- Web UI
- API-only (integrated into other tools)
- IDE extension
- Combination?

**Answer:** Functionality will be exposed via an MCP (Model Context Protocol) server.

---

## Q8: What programming language/runtime for the implementation?

What language should this be built in?
- TypeScript/Node.js
- Python
- Go
- Rust
- Other?

**Answer:** TypeScript/Node.js

---

## Q9: What LLM provider(s) should be supported for test generation and AI assertions?

Which LLM(s) should power the agent's intelligence?
- Amazon Bedrock (Claude, etc.)
- OpenAI API
- Anthropic API directly
- Multiple providers with abstraction layer
- Other?

**Answer:** Amazon Bedrock

---

## Q10: How should the agent access the codebase and requirements?

You mentioned the agent takes codebase and requirements as input. How should these be provided?
- File paths to local directories/files
- Git repository URLs
- Inline text/content
- URLs to documentation (Quip, wiki, etc.)
- Combination of the above?

**Answer:** 
- Codebase: GitHub repo URL or pull request URL
- Requirements: Inline text/content

---

## Q11: What should happen when a test fails?

When a test step fails, how should the agent behave?
- Stop execution immediately
- Continue running remaining tests and report all failures
- Retry failed steps a configurable number of times
- Configurable behavior per test plan?

**Answer:** Stop execution immediately on failure.

---

## Q12: What information should be captured in test run results?

What details should be recorded for each test run?
- Pass/fail status per step
- Screenshots/visual evidence
- Timing/duration metrics
- LLM reasoning for AI assertions
- Full request/response logs
- All of the above?

**Answer:** All of the above:
- Pass/fail status per step
- Screenshots/visual evidence
- Timing/duration metrics
- LLM reasoning for AI assertions
- Full request/response logs

---

## Q13: How should the agent handle authentication for the target application?

If the frontend application requires login, how should the agent authenticate?
- Credentials provided in test plan configuration
- Pre-authenticated session/cookies provided
- OAuth/SSO flow handled by the agent
- Assume the application is already in an authenticated state
- Other?

**Answer:** For now, assume the application doesn't require authentication.

---

## Q14: What MCP tools should the server expose?

What operations should be available via the MCP server? For example:
- `generate_test_plan` - create a test plan from requirements
- `run_test_plan` - execute an existing test plan
- `list_test_plans` - view available test plans
- `get_test_results` - retrieve results from a test run
- Others?

**Answer:** MCP tools to expose:
- `generate_test_plan` - create a test plan from requirements
- `run_test_plan` - execute an existing test plan
- `list_test_plans` - view available test plans
- `list_test_runs` - list all test run executions
- `get_test_run` - retrieve details/results of a specific test run

---

## Q15: Where should test plans and test runs be stored on disk?

What directory structure do you prefer for storing the JSON files?
- A configurable base directory with subdirectories for plans and runs
- Alongside the target project's codebase
- A dedicated `.qa-agent/` directory
- User-specified per operation?

**Answer:** A dedicated `.qa-agent/` directory.

---

## Q16: What is the expected scale/scope for the initial prototype?

To help scope the design appropriately:
- How many test plans might exist at once? (handful, dozens, hundreds)
- How long might a typical test run take? (seconds, minutes, longer)
- Any concurrent execution requirements?

**Answer:** 
- Hundreds of test plans, organized by projects
- Each test plan takes minutes to run
- Each individual test takes seconds
- Tests and test plans should be runnable in parallel

---

## Q17: How should projects be defined and managed?

Since test plans are organized by projects:
- Should projects be explicitly created/configured, or inferred from the GitHub repo?
- What metadata should a project have (name, URL, description)?
- Should there be an MCP tool to manage projects (create, list, delete)?

**Answer:**
- Projects inferred from GitHub repo by default (1 project per repo)
- Can be tied to specific parts of the repo if needed
- Metadata: name and description
- No MCP tool needed for project management
- Plans saved at the root of where they are called from (cwd)

---

## Q18: Can you walk me through a typical user workflow?

To ensure I understand the end-to-end experience, could you describe a typical scenario? For example:
1. User has a running frontend app at `http://localhost:3000`
2. User provides requirements text and GitHub repo URL
3. Agent generates test plan
4. User runs the test plan
5. User views results

Is this accurate? Any steps I'm missing or getting wrong?

**Answer:** Workflow is:
1. User has a running frontend app
2. User provides requirements text and GitHub repo URL
3. Agent generates test plan
4. Agent runs the test plan using rtrvr.ai
5. User views results

---

## Q19: Should the user be able to review/edit the test plan before execution?

After the agent generates a test plan:
- Should execution be automatic, or should the user confirm/approve first?
- Should users be able to manually edit the generated test plan JSON?
- Should there be an MCP tool to modify an existing test plan?

**Answer:** User should be able to review the test plan before execution (generation and execution are separate steps).

---

## Q20: What success criteria would make this prototype valuable?

What would "done" look like for the initial prototype? For example:
- Successfully generate a test plan from plain English requirements
- Execute at least one agentic browsing test against a live frontend
- Store and retrieve test results
- Something else?

**Answer:** All of the above. Priority:
1. **Most important:** Generate a test plan and execute it using agentic browsing
2. Store and retrieve test results

---

