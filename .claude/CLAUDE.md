
# TypeScript + Node.js + Next.js Agent Rules

## Project Context
You are an expert TypeScript developer working with Node.js runtime and Next.js. This project is a Web App.

## Code Style & Structure
### TypeScript Defaults
- Use TypeScript strict mode with `strict: true` in `tsconfig.json` — enables `strictNullChecks`, `noImplicitAny`, and other safety checks.
- Use `const` by default; `let` only when reassignment is needed. Never use `var`.
- Use `interface` for object shapes that may be extended and `type` for unions, intersections, and mapped types.
- Prefer `unknown` over `any` — it forces type narrowing before use and catches bugs at compile time.
- Avoid `any` — use `unknown` with type guards when the type is truly unknown.
- Use discriminated unions for state management over boolean flags.
- Prefer small, focused functions under 30 lines. Extract helpers when logic grows.
- Use `readonly` for arrays and properties that should not be mutated.
- Prefer explicit return types on exported functions for documentation and faster type-checking.

### Node.js Modern Built-ins
- Use `--env-file` instead of `dotenv` for loading environment variables.
- Use `node:` prefix for all built-in modules (`node:fs`, `node:path`, `node:crypto`).
- Use `fs/promises` over callback-based `fs` APIs.
- Use `structuredClone()` instead of `JSON..parse(JSON.stringify())`.
- Use `crypto.randomUUID()` instead of `uuid` package.
- Use `AbortController` for cancellable operations.
- Use `node:util.parseArgs()` instead of `commander`/`yargs` for simple CLIs.
- Use `node:worker_threads` for CPU-intensive tasks.
- Use `node:stream/promises` pipeline for stream processing.
- Prefer top-level `await` in ESM modules.
- Use `--experimental-strip-types` (Node 22+) for direct TypeScript execution.

### Google TypeScript Style Guide
- Use Google-style JSDoc docstrings for every public module, class, function, and method.
- Annotate all functions, methods, class members, and variables with specific TypeScript types.
- Structure docstrings with Args, Returns, and Throws sections for parameters, return values, and exceptions.
- Use `interface` for object shapes and `type` for unions/aliases: `interface User { id: string; name: string }` vs `type Status = 'active' | 'inactive'`.
- Write `@param` and `@returns` JSDoc for all public APIs: `/** @param id - User identifier. @returns The user record or null if not found. */`.
- Annotate return types explicitly on public APIs: `async function fetchUser(id: string): Promise<User | null>` — never rely on inference for exported functions.
- Prefer `unknown` over `any`; narrow with type guards: `if (typeof val === 'string') { processString(val); }`.

## Linting & Formatting
### ESLint
- Use ESLint flat config (`eslint.config.js`). Extend recommended configs for your framework.
- Run `eslint --fix .` for auto-fixable issues. Run `eslint .` in CI without `--fix`.
- Use `typescript-eslint` with `strict` and `stylistic` configs — enable type-checked rules with `parserOptions.project` for deep type analysis.
- Use `@typescript-eslint/recommended` for TypeScript projects. Enable `strict` preset for stricter checks.
- Configure `no-unused-vars`, `no-console`, `prefer-const` as errors — catch real issues, not style nits.

## Styling
### Tailwind CSS
- Use `@apply` in component CSS only as a last resort — prefer utility classes in templates.
- Use the `cn()` (clsx + twMerge) utility for conditional class merging — it resolves Tailwind class conflicts correctly.
- Use `tailwind.config.ts` to define design tokens: colors, spacing, fonts, breakpoints.
- Use component extraction to avoid repeating class combinations — encapsulate repeated patterns in reusable components or partials.
- Use responsive prefixes (`sm:`, `md:`, `lg:`) for mobile-first responsive design.
- Use `dark:` variant for dark mode support. Use `group-*` and `peer-*` for conditional styling.

## Next.js
- Type page props with `{ params: Promise<{ slug: string }>, searchParams: Promise<Record<string, string>> }` — params are async in App Router.
- Use `Metadata` and `generateMetadata({ params }: Props): Promise<Metadata>` from `next` for typed SEO metadata.
- Default to Server Components; mark Client Components with `'use client'` and define a `Props` interface for each component.
- Type API route handlers with `NextRequest` and `NextResponse`: `export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>>` — avoid `any` in route return types.
- Type Server Actions with explicit parameter and return types: `async function createItem(formData: FormData): Promise<{ error?: string }>`.
- Use `revalidatePath()` and `revalidateTag()` with typed tag constants to avoid string typos in cache invalidation.
- Define route params as a shared type when used across `page.tsx`, `layout.tsx`, and `generateMetadata` in the same segment.
- Prefer `notFound()` and `redirect()` from `next/navigation` with typed route strings over manual Response construction.

## Architecture
### Web App Architecture
- Separate UI components, business logic, and data fetching into distinct layers.
- Choose rendering strategy intentionally: SSR for SEO, CSR for interactivity, SSG for static content.
- Use server-side rendering (SSR) or static generation (SSG) for initial page loads — hydrate on the client for interactivity.
- Implement client-side routing with proper loading and error states for each route.
- Use a state management approach appropriate to complexity — local state first, global store when needed.

## Performance
### Performance Guidelines
- Profile before optimizing — measure, don't guess. Premature optimization wastes time and adds complexity.
- Optimize the critical path first. 90% of performance comes from 10% of the code.
- Cache expensive computations and database queries — use appropriate TTLs and invalidation strategies based on data freshness requirements.
- Cache expensive computations and API calls. Invalidate caches explicitly — stale data is a bug.
- Use lazy loading for non-critical resources and code paths.
- Debounce user-input-driven operations (search, resize, scroll).
- Prefer pagination or virtual scrolling for large data sets — never render 10,000 DOM nodes.

### TypeScript Performance
- Use `for` loops or `for...of` instead of `forEach` or `map` in hot code paths for better performance.
- Avoid unnecessary object allocations inside loops to reduce garbage collection pressure.
- Use `Map` and `Set` for frequent insertions, deletions, and keyed sideups instead of plain objects or arrays.
- Cache results of expensive computations manually or use memoization techniques.
- Avoid synchronous blocking I/O methods; always use async/await equivalents.
- Debounce or throttle high-frequency events to prevent CPU spikes.
- Use `structuredClone` for deep copying instead of `JSON.parse(JSON.stringify())`.

## Testing
### TypeScript Testing
- Write tests alongside source files (`*.test.ts`) or in a `__tests__/` directory.
- Use the Arrange-Act-Assert pattern: set up data, perform the action, verify the result.
- Mock external dependencies (APIs, databases) — test your logic, not the network.
- Use `describe` blocks to group related tests. Use `it` with descriptive names: `it("should return 404 when user not found")`.
- Use typed test fixtures and factories for consistent, type-safe test data.
- Use `beforeEach` for setup and `afterEach` for cleanup — avoid shared mutable state between tests.

### node:test Patterns
- Use `node:test` as the built-in test runner with `describe`/`it` blocks and `node:assert/strict`.
- Use `--watch` flag with `node --test` for test-driven development.
- Use `node:test`'s built-in coverage with `--experimental-test-coverage`.

### React Testing Library
- For TypeScript: Structure tests with describe('ComponentName') and it('descriptive scenario') blocks.
- Render components via render(<ComponentName prop="value" />) and query elements using screen.getByRole('button') or screen.getByText('text').
- Simulate interactions with const user = userEvent.setup(); await user.click(screen.getByRole('button')).
- Assert presence or state with expect(screen.getByText('expected')).toBeInTheDocument().
- Create mock handler functions and verify calls with expect(mockFn).toHaveBeenCalledWith(expectedArgs).
- For TypeScript: Clear all mocks in beforeEach to ensure test isolation and consistent starting state.
- Handle async behavior with waitFor(() => expect(element).toBeInTheDocument()) for updates after interactions.
- Prefer accessible queries like getByRole over getByTestId to mimic real user behavior and improve test resilience.
- Render with required props or context to match real usage and avoid default prop issues.
- Combine multiple assertions in a single test for related user flows.

### Playwright
- Use Playwright for E2E, integration, and browser tests simulating user interactions.
- Write tests in TypeScript for type-safe selectors, actions, and assertions.
- Run tests via `npx playwright test` or npm scripts for local and CI execution.
- Test across Chromium, Firefox, and WebKit browsers for cross-browser reliability.
- Configure playwright.config.ts with baseURL, viewport sizes, and timeouts to match production environments and reduce flakiness.
- Leverage auto-waiting features and expect() assertions for robust, low-maintenance tests without manual sleeps.
- Enable tracing, screenshots, and video capture on failure for efficient debugging of intermittent issues.
- Use getByRole, getByText, or getByTestId locators prioritizing accessibility over fragile selectors.

### Vitest
- For TypeScript: Only write Vitest tests when resolving a specific user issue or upon explicit request.
- Import core functions as `import { describe, it, expect } from 'vitest';`.
- Use jsdom environment for DOM-related tests and node for others.
- Write focused, isolated test cases.
- Configure Vitest coverage with exclusion patterns and multiple report formats.
- Mock modules with `vi.mock('../db', () => ({ query: vi.fn<[string], Promise<Row[]>>() }))` — use generic type parameters on `vi.fn<TArgs, TReturn>()` for type-safe mock functions.
- Use `vi.spyOn(obj, 'method').mockResolvedValue(result)` to patch individual methods with typed return values.
- Assert async results: `await expect(fetchUser('1')).resolves.toMatchObject({ id: '1', name: expect.any(String) })` and `await expect(fetchUser('')).rejects.toThrow('invalid id')`.
- Use `vi.useFakeTimers()` with `vi.advanceTimersByTime(ms)` to test debounced functions and polling intervals without real delays.
- Configure per-file environment: `// @vitest-environment jsdom` for DOM tests, `// @vitest-environment node` for server-side code.

## Libraries & Tools
### Zod
- Define schemas with `z.object({})` for validation — use `z.infer<typeof schema>` to derive TypeScript types from schemas.
- Validate at system boundaries: API inputs, form data, environment variables, config files — fail fast with descriptive error messages.
- Use `z.enum()` for string literals, `z.discriminatedUnion()` for tagged unions, `z.transform()` for parsing and coercion.
- Use `.parse()` to throw on invalid data, `.safeParse()` to get a Result-like `{ success, data, error }`.
- Compose schemas: use `.extend()`, `.merge()`, `.pick()`, `.omit()` to build variants from base schemas.
- Use `.transform()` for coercion and normalization (trimming strings, parsing dates).

### Zustand
- Create stores with `create()`: define state and actions in a single function. Access with hooks.
- Keep stores small and focused — one store per domain concern, not one global store.
- Use selectors (`useStore(state => state.count)`) to subscribe to specific state slices — prevents unnecessary re-renders from unrelated changes.
- Use selectors to subscribe to specific state slices: `useStore((state) => state.count)` — avoid re-renders from unrelated state changes.
- Use `immer` middleware for immutable updates on deeply nested state.
- Define actions inside the store alongside state — colocate state and the logic that modifies it.
- Use `persist` middleware for localStorage/sessionStorage persistence.

### React Hook Form
- Use `useForm<FormValues>()` with a schema resolver for type-safe, schema-validated forms.
- Use `register()` for uncontrolled inputs, `Controller` for controlled components (Select, DatePicker).
- Use `useFormContext<FormData>()` in nested components with `FormProvider` — maintains full TypeScript types without prop drilling.
- Use `handleSubmit` wrapper — it validates before calling your submit handler.
- Use `formState.errors` for field-level error display. Show errors next to the relevant input.
- Use `watch()` sparingly — prefer `useWatch()` for isolated re-renders on specific fields.
- Use `defaultValues` to initialize forms. Use `reset()` to clear forms after successful submission.
