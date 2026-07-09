# Test commands for the project

## Run all tests

- If the project is Node-based (Jest / npm):
	- npm:    npm test
	- yarn:   yarn test

- If the project uses Jest directly:
	- npx jest

- If the project is Python/pytest:
	- pytest

## Run a single test file

- npm / yarn (Jest):
	- npx jest path/to/testfile.test.js

- pytest:
	- pytest path/to/test_file.py::test_name

## Watch mode

- Jest watch: npx jest --watch
- pytest watch (requires pytest-watch): ptw

## Run tests with coverage

- Jest: npx jest --coverage
- pytest: pytest --cov=.

## Notes

- Run commands from the project root. Adjust the specific command to match the project's test runner.
