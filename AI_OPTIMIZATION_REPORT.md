# AI Optimization Report

## Introduction

I used AI tools during the development of ApparelFlow ERP to help with code generation, debugging, database design, testing ideas, and UI improvements.

However, I did not use all AI-generated code directly. Some suggestions had security problems, incorrect assumptions about the database, or implementation issues. I tested the generated solutions, checked them against the assessment requirements, and changed them where necessary.

This report explains some of the main problems I identified and how I improved the final implementation.

---

## 1. Tools and Prompting

I mainly used AI assistance for:

- Planning the application structure
- Creating the initial Next.js project structure
- Designing the Supabase database
- Generating TypeScript and Zod validation code
- Creating server actions
- Designing PostgreSQL RPC functions
- Debugging authentication and authorization issues
- Improving the dashboard UI
- Generating ideas for automated tests
- Debugging deployment and dependency problems

I used AI as a development assistant rather than relying on it to make the final technical decisions.

For security-sensitive features such as verification approval, role checking, and sewing transitions, I reviewed the generated solution before using it.

---

## 2. Database and Audit Log Security

### Initial Problem

One of the early approaches allowed the application to interact with verification data too directly.

This was a concern because `verification_logs` are supposed to represent the permanent history of verification decisions. Normal application users should not be able to edit or delete these records after a decision has been recorded.

### What I Changed

I moved the important verification operations into PostgreSQL RPC functions:

- `approve_cutting_batch`
- `reject_cutting_batch`

These functions use `SECURITY DEFINER` and controlled permissions.

Direct modification permissions for verification audit records were restricted so normal browser sessions cannot update or delete audit history.

### Why This Was Better

This moved an important security rule from the frontend into the database layer.

Even if someone tries to bypass the UI and directly call the backend, the application does not depend only on hidden buttons or frontend validation to protect verification history.

---

## 3. Server-Side RBAC and Trusted User Identity

### Initial Problem

An early RPC design considered passing the verifier's user ID from the application to the database.

For example, a browser request could potentially contain something similar to:

`verifier_id: "some-user-id"`

I identified this as unsafe because information coming from the browser should not be trusted for authorization.

### What I Changed

The final implementation does not accept the verifier or supervisor identity from the client.

Instead, the database obtains the authenticated user through:

`auth.uid()`

The Auth UUID is then matched with:

`public.users.auth_user_id`

The user's application role is checked before the protected operation is allowed.

Next.js server actions also use server-side role checks before calling protected RPC functions.

### Why This Was Better

A user cannot become a Cutting Verifier simply by changing a role or user ID in a browser request.

Authorization is based on the authenticated Supabase session and the role stored in the database.

---

## 4. Verification Hard Stop

### Initial Problem

One of the first approaches relied too much on frontend traffic-light validation.

The UI could identify a component as RED and disable the Approve button, but frontend validation alone would not satisfy the assessment security requirement.

A user could potentially bypass a frontend check by sending a request manually.

### What I Changed

I kept the traffic-light feedback in the UI but also enforced the rule in the database.

During approval, the backend checks the component quantities again.

The main rules are:

- GREEN: Actual = Expected
- YELLOW: Actual > Expected
- RED: Actual < Expected

If any required component is RED, missing, or uncounted, the approval operation fails.

The order therefore cannot transition to `VERIFIED`.

### Why This Was Better

The frontend improves usability, while the backend provides the actual security boundary.

Even if the frontend is bypassed, an invalid cutting batch still cannot be approved.

---

## 5. Sewing Queue State Protection

### Initial Problem

An early implementation idea was to update the order from Next.js using a normal database update such as changing the status directly to `SEWING`.

This was too permissive because the business rule requires an order to be `VERIFIED` before sewing can start.

### What I Changed

I created the PostgreSQL function:

`start_sewing_batch`

The function performs the transition only when the current order status is `VERIFIED`.

The update uses the existing status as part of the database condition rather than trusting a status value supplied by the browser.

The Sewing Ready Queue also queries only orders where:

`status = 'VERIFIED'`

### Why This Was Better

The Sewing Supervisor cannot move a pending or rejected order directly into sewing.

The database itself protects the required workflow.

---

## 6. React Form Bug and Human Refactoring

### Initial Problem

During the Cutting Order implementation, the form initially used:

`e.currentTarget.reset()`

after an asynchronous operation.

This caused a runtime problem because the event target was no longer reliable after the `await` operation.

### What I Changed

I converted the important form inputs to controlled React state.

After a successful order creation, I reset the state values directly instead of depending on the original form event.

### Why This Was Better

The form became more predictable and easier to manage.

It also made validation, loading states, and resetting the form after submission more reliable.

---

## 7. Database Schema Assumptions

### Initial Problem

Some early AI-generated code made assumptions about database column names and authentication mappings.

For example, the actual database schema had to be checked to confirm fields such as:

- `recipes.name`
- `recipes.wastage_cap`
- `cutting_orders.order_no`
- `public.users.auth_user_id`

There were also initial assumptions about Supabase Auth user UUIDs that did not match the actual authenticated users.

### What I Changed

I checked the live Supabase schema and Auth records instead of continuing with assumed values.

The TypeScript database types and application queries were then updated to match the real database structure.

Auth users were correctly mapped through `auth_user_id`.

### Why This Was Better

The application now works against the actual database instead of relying on generated assumptions.

This also reduced the chance of runtime errors caused by incorrect field names or user mappings.

---

## 8. Automated Testing Strategy

### Initial Problem

I initially tried to use Vitest for the automated test suite.

This introduced dependency and module-resolution problems in the project environment. It also later caused a Vercel installation conflict because an unused Vitest dependency/configuration remained in the project.

### What I Changed

Instead of forcing Vitest to work, I changed the test setup to use:

- Node.js native test runner (`node:test`)
- `tsx`
- Real Supabase integration testing

I then removed the unused Vitest dependency and configuration.

### Why This Was Better

The final test setup is smaller and works with the existing project without requiring a large additional testing configuration.

The integration tests also test the actual Supabase RPC security boundaries rather than only mocking the backend.

The mandatory test cases cover:

1. A valid GREEN batch can be approved.
2. A RED component blocks approval.
3. A rejection without a reason is rejected.
4. A non-verifier cannot approve a batch.
5. Unapproved orders do not appear in the Sewing Ready Queue.

Additional unit tests cover input validation rules.

---

## 9. Deployment Issue and Final Fix

### Initial Problem

The application worked locally but initially failed during Vercel deployment.

One problem was the remaining Vitest dependency/configuration.

After that was corrected, the deployed application returned a middleware error because the required Supabase environment variables had not been configured in Vercel.

### What I Changed

I removed the unused Vitest files and refreshed the project dependencies.

I also configured the required production environment variables in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

No Supabase service-role key is exposed to the browser.

### What I Learned

A successful local build does not guarantee that the production environment is configured correctly.

Deployment configuration, dependency files, and environment variables also need to be verified.

---

## 10. Defensive Architecture

The final application uses several layers of protection rather than relying on a single frontend check.

### Authentication

Supabase Auth provides the authenticated user session.

### Application RBAC

Server-side role checks restrict each workflow to its required role.

### Database Authorization

Protected PostgreSQL RPC functions derive the current user from `auth.uid()` and verify the corresponding application role.

### State Transition Protection

Important workflow transitions are performed through controlled database functions rather than accepting arbitrary status changes from the browser.

### Verification Protection

RED, missing, or uncounted components prevent approval at the backend.

### Sewing Queue Protection

Only `VERIFIED` orders are returned by the Sewing Ready Queue query.

### Audit Protection

Verification decisions are stored as audit records and normal application users cannot directly modify the recorded verification history.

These layers make the system more resistant to frontend manipulation and direct API requests.

---

## Conclusion

AI tools helped me develop ApparelFlow ERP faster, especially when creating initial code structures, debugging issues, and exploring possible solutions.

However, several generated suggestions needed to be checked and changed. The most important improvements were moving security-sensitive rules to the server and database, using the authenticated Supabase identity instead of client-provided user information, protecting state transitions with PostgreSQL RPC functions, and testing the real backend behavior.

The project also showed me that AI-generated code should not be accepted only because it compiles. I still needed to compare it with the business requirements, test it, inspect the database behavior, and make changes where the generated solution was incomplete or unsafe.

The final implementation therefore combines AI-assisted development with manual testing, security review, debugging, and engineering decisions.
