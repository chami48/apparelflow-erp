# ApparelFlow ERP

ApparelFlow ERP is a full-stack manufacturing workflow application developed for the Webtezza Software Engineering Intern Practical Assessment.

The project implements the Cutting Operations and Gatekeeper Verification workflow for a garment production environment. It ensures that a cutting batch cannot enter the sewing process until all required garment components have been verified by an authorized Cutting Verifier.

## Live Demo

https://apparelflow-erp-eight.vercel.app/login

## Technology Stack

- Next.js 16.3.8
- React
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Authentication
- Zod
- Node.js Native Test Runner
- TSX
- Vercel

## User Roles

### Cutting Supervisor

Role: `cutting_supervisor`

Responsibilities:

- Create cutting orders
- Select a production recipe
- Enter target batch quantity
- Enter fabric roll ID
- Record actual fabric usage
- Submit batches for verification

The Cutting Supervisor cannot approve verification batches or access the Sewing Queue.

### Cutting Verifier

Role: `cutting_verifier`

Responsibilities:

- View batches waiting for verification
- Enter actual component quantities
- Review GREEN, YELLOW, and RED component statuses
- Approve valid batches
- Reject invalid batches with a mandatory reason

The Cutting Verifier cannot create cutting orders or access the Sewing Queue.

### Sewing Supervisor

Role: `sewing_supervisor`

Responsibilities:

- View verified production batches
- Review batch information
- Start sewing operations

Only VERIFIED batches are available in the Sewing Ready Queue.

## Production Workflow

The application follows the following manufacturing workflow:

CUTTING_IN_PROGRESS
→ PENDING_VERIFICATION
→ VERIFIED or REJECTED
→ SEWING

A batch cannot move directly from PENDING_VERIFICATION to SEWING.

## Production Recipes

The database contains the two recipes required by the assessment.

### REC-BL01 - Casual Blouse

- Standard Fabric: 1.8 yards per garment
- Wastage Cap: 5%
- Front Body Panel: 1
- Back Body Panel: 1
- Sleeves (Left & Right): 2
- Collar & Stand: 1
- Sleeve Cuffs: 2

### REC-CT02 - Crop Top

- Standard Fabric: 1.1 yards per garment
- Wastage Cap: 8%
- Front Chest Panel: 1
- Back Support Panel: 1
- Neck Binding Strip: 1
- Hem Elastic Casing: 1
- Side Strap Accents: 2

## Component Multiplier

Expected component quantities are calculated from the production recipe and target batch quantity.

Example:

Target Quantity: 50 garments

Sleeve Cuffs per Garment: 2

Expected Sleeve Cuffs:

50 × 2 = 100

The expected quantities are calculated using trusted recipe data rather than values supplied by the browser.

## Verification Traffic-Light Rules

Each component is evaluated using its expected and actual quantities.

| Status | Condition | Meaning |
|---|---|---|
| GREEN | Actual = Expected | Exact quantity |
| YELLOW | Actual > Expected | Excess quantity |
| RED | Actual < Expected | Component shortage |

A batch containing a RED component cannot be approved.

The UI prevents approval and the database also enforces the rule server-side.

## Server-Side Security

Security rules are not based only on frontend controls.

Authentication is handled using Supabase Auth.

The authenticated user's identity is obtained from the server session and mapped to the application's `public.users` table.

Protected operations verify the user's role before executing.

Database RPC functions use `auth.uid()` to determine the authenticated user instead of accepting a user ID or role from the browser.

Critical state transitions are implemented through PostgreSQL functions including:

- `create_cutting_order_atomic`
- `approve_cutting_batch`
- `reject_cutting_batch`
- `start_sewing_batch`

Protected RPC functions use restricted execution permissions and a controlled `search_path`.

## Gatekeeper Hard Stop

The verification process provides a server-enforced hard stop.

Approval is rejected when:

- Any component is RED
- A component has not been counted
- Required component data is missing
- The authenticated user is not a Cutting Verifier

This prevents invalid batches from reaching the Sewing Queue even if frontend validation is bypassed.

## Sewing Queue Protection

The Sewing Ready Queue retrieves orders using a database-level condition:

`status = 'VERIFIED'`

PENDING_VERIFICATION, REJECTED, CUTTING_IN_PROGRESS, and SEWING orders are not returned as sewing-ready batches.

Starting sewing also performs a protected transition:

VERIFIED → SEWING

## Wastage Calculation

Fabric wastage is calculated using:

Wastage % =
((Actual Fabric Used - Expected Fabric) / Expected Fabric) × 100

The result is stored as part of the verification audit information.

## Audit Trail

Verification decisions are recorded in `verification_logs`.

Audit information includes:

- Order
- Verifier
- Decision
- Verification timestamp
- Rejection reason where applicable
- Fabric wastage percentage

Application users are not allowed to update or delete audit records directly.

## Database Structure

The main relational entities are:

### users

Stores application users and roles.

Important fields:

- id
- email
- full_name
- role
- auth_user_id

### recipes

Stores garment production recipes.

Important fields:

- id
- recipe_code
- name
- category
- std_fabric_yards
- wastage_cap

### recipe_components

Stores components belonging to each production recipe.

Important fields:

- id
- recipe_id
- component_name
- pieces_per_garment

### cutting_orders

Stores production cutting batches.

Important fields:

- id
- order_no
- recipe_id
- target_qty
- fabric_roll_id
- actual_fabric_yds
- status
- created_by
- created_at
- updated_at

### verification_items

Stores expected and actual component quantities.

Important fields:

- id
- order_id
- component_id
- expected_qty
- actual_qty
- status

### verification_logs

Stores verification audit records.

Important fields:

- id
- order_id
- verifier_id
- decision
- rejection_reason
- wastage_pct
- verified_at

## Local Setup

Clone the repository and install dependencies:

```bash
npm install
