# Smart contracts written in PyTEAL

Initial code copied over from https://github.com/algorand/auction-demo

## Requirements

- [Python 3][python]
- [Poetry][poetry]
- [Algorand Sandbox][sandbox]

## Setup

```bash
poetry shell # create or start virtual environment with poetry
poetry install # install dependencies
```

> In VS Code, make sure you specify the right Python interpreter. You can find the path to the one Poetry setup via:
>
> ```bash
> which python | pbcopy
> ```
>
> And then run the VS Code command `Python: Select Interpreter` and paste in the path.

## Build contracts

```bash
./build.sh
```

## Run tests

> When running tests, be sure to run the Algorand Sandbox in the default "SandNet" mode. The tests assume Algod and KMD are available with the default URLs, ports, and tokens.

```bash
./test.sh
```

[python]: https://www.python.org/
[poetry]: https://python-poetry.org/docs/
[sandbox]: https://github.com/algorand/sandbox
