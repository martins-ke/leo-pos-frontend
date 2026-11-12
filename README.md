# Leo Frontend

Leo is a React single-page application for retail shop owners and staff. It provides public landing, login, owner registration, platform setup, and role-protected shop workflows for point of sale, inventory, sales, customers, staff, and finance.

The application uses React Router, feature-local CSS Modules, shared components under `src/components/`, and a separate Spring Boot API. It is not currently a PWA or server-rendered application.

## Local development

Requirements: Node.js supported by the installed Vite release and npm.

```sh
npm install
npm run dev
```

By default, the frontend API client uses `http://localhost:8181`. Set `VITE_API_BASE_URL` in a local environment file when the API runs at another origin. In production, use an HTTPS API origin or same-origin reverse proxy. Frontend environment variables are public build-time values; never place secrets in `VITE_*`.

## Available checks

```sh
npm run lint
npm test
npm run build
npm run preview
```

`npm test` runs the frontend's Node-based unit tests. Browser E2E coverage is not configured yet. Run `npm run build` to validate the production bundle, and use the companion backend project's [testing and performance plan](../../back-end/leo/docs/testing/TESTING_AND_PERFORMANCE.md) for broader verification guidance when both repositories are available in the same workspace.

## Project layout

Feature screens and styles live together under `src/features/`:

- `auth/` — login, registration, and platform setup.
- `dashboard/` — owner summary.
- `finance/` — accounts, customers, debts, expenses, and stock use.
- `inventory/`, `pos/`, `sales/`, `shops/`, and `staff/` — shop workflows.
- `admin/` — platform owner account management.

Shared forms, feedback, layout, navigation, branding, and route protection live under `src/components/`. API requests use `src/api/api.js`; authentication state uses `src/context/`.

Paged transaction and inventory lists use `PaginationControls`. The sales ledger keeps client-side pagination and orders results newest-first across selected shops; shop outlets are also paginated.

## Shared feedback

Use `useFeedback` from a component inside the app to show notifications, acknowledgement dialogs, save status, and confirmation dialogs:

```jsx
import { useFeedback } from './context/useFeedback';

function SaveButton() {
  const { beginSaving } = useFeedback();

  async function save() {
    const status = beginSaving({ title: 'Saving changes' });
    try {
      await saveChanges();
      status.complete({ message: 'Your changes are saved.' });
    } catch (error) {
      status.fail({
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  }

  return <button type="button" onClick={save}>Save</button>;
}
```

Notifications accept `success`, `error`, `warning`, or `info` and disappear after six seconds by default. Use `notify` for routine feedback, `alert({ title, message })` when the user must acknowledge a notice, and `confirm({ title, message, confirmLabel, cancelLabel, variant: 'danger' })` for confirmation. `confirm` resolves to `true` only when confirmed. Acknowledgement dialogs stay open until OK is selected.

## Companion backend documentation

When the backend repository is available beside this frontend repository, see its [requirements](../../back-end/leo/docs/architecture/SRS_Document.md), [architecture](../../back-end/leo/docs/architecture/System_Design_and_Architecture.md), [API reference](../../back-end/leo/docs/api/API_REFERENCE.md), and [security guidance](../../back-end/leo/docs/security/SECURITY_AND_DATA_HANDLING.md).
