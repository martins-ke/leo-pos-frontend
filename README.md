# React + Vite

## Feature organization

Feature-specific screens and styles live together under `src/features/`:

- `auth/` contains login and registration screens and shared auth styles.
- `dashboard/` contains the dashboard screen and its operational page styles.
- `finance/` contains accounts, customers, debts, expenses, and stock-use screens and shared finance styles.
- `pos/` contains the point-of-sale screen and its stylesheet.
- `inventory/` contains the inventory screen and its stylesheet.
- `sales/` contains the sales ledger and its stylesheet.
- `shops/` contains shop outlet management and its stylesheet.
- `staff/` contains staff management.

Feature-specific styles belong beside their screens; reusable finance and operational styles remain in their corresponding feature stylesheets.

Paged transaction and inventory lists use `PaginationControls`. The sales ledger keeps its existing client-side pagination and orders results newest-first across all selected shops; shop outlets are also paginated.

## Shared component organization

Shared UI components live under `src/components/` grouped by responsibility:

- `feedback/` contains global notifications and status overlays.
- `forms/` contains shared form controls and modal forms.
- `buttons/` contains shared action button styles.
- `layout/` contains the application shell and sidebar.
- `navigation/` contains pagination controls.
- `routing/` contains protected-route behavior.

## User feedback

Use `useFeedback` from a component inside the app to show notifications, save status, and confirmation dialogs:

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

Notifications accept `success`, `error`, `warning`, or `info` types and disappear after six seconds by default. Use `notify({ type: 'error', message: 'Could not load data.' })` to show an error card. Use `confirm({ title, message, confirmLabel, cancelLabel, variant: 'danger' })` for confirmation; it returns a promise that resolves to `true` only when confirmed. A completed save dialog closes with its OK button, Escape, or a click outside it.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
