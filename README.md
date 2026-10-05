# ApparelFlow ERP

## Project Context
This repository contains the completed **Phase 7 Assessment** for **Webtezza ApparelFlow ERP**. It demonstrates a highly secure, role-restricted, distributed manufacturing gateway managing the exact transition flows required for an industrial garment cutting, verification, and sewing line. 

## Technical Overview
ApparelFlow ERP securely bridges the physical factory floor seamlessly with data endpoints. It executes exclusively authorized cutting batches across exact recipe components natively relying upon PostgreSQL row locks, `SECURITY DEFINER` constraints, and strictly typed TypeScript models. 

### Technology Stack
- **Frontend/Application**: Next.js 14, React 19, TailwindCSS, Zod.
- **Backend/Database**: PostgreSQL (Supabase), `@supabase/supabase-js`, JSONB validations, Pl/PGSQL execution engines.
- **Security**: Supabase Auth (JWT securely parsed Server-Side natively driving RBAC mapping).
- **Testing Engine**: Node Native Test Runner (`v22`), TypeScript AST evaluators.

## Architecture & Security
**Zero-Trust Boundaries**:
- Database queries do not blindly accept identifiers or parameter mapping statuses from Javascript APIs. 
- Using Supabase SSR server interactions, the platform maps incoming generic Auth UUIDs into internal rigid schema hierarchies (`public.users`), permanently decoupling authentication layer abstraction from schema enforcement identifiers exclusively on the server.

**PostgreSQL RPC `SECURITY DEFINER`**:
- Complex state transitions exclusively leverage atomic server functions (RPCs). 
- To securely mutate data asynchronously bypassing standard RLS mapping, functions operate strictly with elevated isolation privileges (`SECURITY DEFINER`) while stripping generalized schema modification abilities (`REVOKE UPDATE... FROM authenticated`). The Application evaluates the exact `auth.uid()`, strictly halting operations misaligned with native constraints.

**Verification Hard-Stop & Sewing Gates**:
- Approval mathematically calculates missing item tolerances inside the Database transaction. If any RED threshold conditions exist statically across `verification_items`, a Database EXCEPTION aggressively blocks state transformation dynamically. 
- Sewing gates selectively query immutable indices mapping exact 'VERIFIED' statuses securely executing `UPDATE ... WHERE id = x AND status = 'VERIFIED'` atomic locks.

## Workflow State Machine
1. **CUTTING_IN_PROGRESS**: Supervisors inject dynamic raw quantity targets.
2. **PENDING_VERIFICATION**: Gate initialized. Verification sub-components populated dynamically per `recipes`.
3. **VERIFIED / REJECTED**: Verifier enforces manual exact counting, capturing reasons across Immutable Logs.
4. **SEWING**: Immutable batch transition selectively executed by Sewing Supervisor.

## Roles
- **Cutting Supervisor** (`cutting_supervisor`): Mints fresh cutting jobs targeting raw fabric allocations.
- **Cutting Verifier** (`cutting_verifier`): Validates component subsets strictly comparing physical outputs. 
- **Sewing Supervisor** (`sewing_supervisor`): Orchestrates exact VERIFIED transitions initiating sewing workloads.

## Setup Instructions

### Environment Setup
Create a `.env.local` inside root containing:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-client-publishable-key
```
>(Note: Service Roles are fiercely excluded explicitly avoiding browser compromise surfaces).

### Database Initialization
Apply `CREATE TABLE`, `CREATE FUNCTION`, and security profiles sequentially utilizing SQL Editor tools securely. Native schema generation requires strictly populating `recipes` (`REC-BL01`, `REC-CT02`) and explicit mappings across `public.users`. Ensure you meticulously replicate constraints avoiding disabling triggers structurally.

### Running Applications Locally
1. `npm install` (Use `--legacy-peer-deps` safely where node resolution clashes occur initially with Next 14/15 packages). 
2. `npm run dev` 

### Executing Native Automated Tests
`npm test` natively integrates NodeJS Native Testing (`node:test`) asserting strictly typed database validations utilizing dynamically generated TEST prefixes, avoiding permanent arbitrary deletions natively mapping against exact live database boundaries over TSX implementations natively. 

### Evaluator Demo Accounts
- **Supervisor**: `cutting.super@apparelflow.com` (Pass: `Cutting@12345`)
- **Verifier**: `cutting.verifier@apparelflow.com` (Pass: `Verifier@12345`)
- **Sewing Mgr**: `sewing.super@apparelflow.com` (Pass: `Sewing@12345`)

## Deployment Assumptions / Checklists
- Project mandates strict internal identity mapping (`auth.users.id` -> `public.users.auth_user_id`). Ensure Supabase Hooks securely initialize mappings natively or statically script identical mapping layers. Ensure Vercel deployments meticulously load corresponding environment configuration strings securely prioritizing Build hooks (`npx tsc --noEmit` & `npm run lint`).
