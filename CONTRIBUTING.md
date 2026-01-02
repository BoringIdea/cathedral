# Contributing to Cathedral

Thanks for your interest in contributing! This document describes how to set up your environment, the workflow we follow, and the expectations for pull requests.

## Quick Start

1. Fork the repository and clone your fork.
2. Install workspace dependencies (frontend/contracts):
   ```bash
   yarn install
   ```
3. Install backend dependencies separately:
   ```bash
   cd apps/backend
   yarn install
   ```
4. Create a feature branch from `main`.

## Development Workflow

- **Backend**: run `yarn start:dev` inside `apps/backend`. Use `yarn build` and `yarn test` for production builds and tests.
- **Frontend**: from the repository root run `yarn dev` to start the Next.js application.
- **Contracts**: follow the instructions inside `apps/contracts/README.md` for Anchor builds and tests.

Please add or update tests when changing behaviour. Run relevant linting or formatting commands before opening a pull request.

## Pull Requests

- Describe the problem and the solution clearly in the PR description.
- Reference related issues when applicable.
- Keep commits focused; avoid combining unrelated changes.
- Ensure CI checks pass.

## Coding Guidelines

- Follow the existing code style; respect ESLint and Prettier configurations.
- Prefer TypeScript for new code.
- Keep secrets and private keys out of the repository. Use `.env` files or secret managers instead.

## Reporting Issues

Use GitHub Issues to report bugs or request features. When reporting a bug, include reproduction steps, expected behaviour, and any logs that help diagnose the issue.

