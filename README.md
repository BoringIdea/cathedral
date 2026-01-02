# Cathedral Monorepo

This repository hosts the unified codebase for the Cathedral backend services, web application, and on-chain programs. The workspace layout follows a multi-app structure, while the backend now maintains its own dependency installation to keep builds fast.

## Directory Layout

- `apps/backend` – NestJS API and background workers (standalone dependency install).
- `apps/website` – Next.js marketing site and dashboard.
- `apps/contracts` – Anchor-based Solana programs and deployment scripts.
- `config/` – Centralized linting, formatting, and testing configuration files.
- `scripts/` – Cross-project automation scripts.
- `infra/` – Infrastructure-as-code, container definitions, and deployment manifests.

## Getting Started

```bash
yarn install
```

This installs dependencies for the front-end and on-chain projects that remain in the Yarn workspace.

### Backend (NestJS)

Install and run from within the backend directory:

```bash
cd apps/backend
yarn install
yarn start:dev
```

Use `yarn build` / `yarn test` inside the same directory when required.

### Website (Next.js)

Run from the repository root:

```bash
yarn dev
```

Refer to the documentation inside each app for environment variables and service-specific workflows.

## Security

If you believe you have found a security vulnerability, please review [`SECURITY.md`](SECURITY.md) for responsible disclosure guidelines.

## License

This project is licensed under the Business Source License 1.1. See [`LICENSE`](LICENSE) for the license text, parameters, and change date. After the change date, the project will transition to the GNU General Public License v2.0 or later.
