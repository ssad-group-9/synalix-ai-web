# Synalix AI Web - AI Agent Instructions

## Project Architecture

This is a **Vue 3 + TypeScript + Vuetify** single-page application for AI model training management. Uses **Pinia** for state management with persistence and **Axios** for API communication with automatic JWT token management.

### Key Architecture Patterns

**Authentication Flow**: The app uses JWT access/refresh tokens managed by `src/stores/auth.ts` with automatic refresh in `src/api/client.ts`. All API requests auto-inject Bearer tokens, and 401 responses trigger token refresh or redirect to login.

**Route Protection**: Router guards in `src/router/index.ts` use route meta properties:

- `requiresAuth: true` - Protected routes requiring login
- `requiresAdmin: true` - Admin-only routes
- `requiresGuest: true` - Guest-only routes (login page)
- `hideToolbar: true` - Hide app toolbar (login/admin pages)

**Layout System**: `src/components/AppLayout.vue` wraps all content and conditionally shows `AppToolbar.vue` based on route meta. Admin console and login pages hide the toolbar.

## Development Workflow

**Start Development**: `npm run dev` (requires Node.js 20.19+ or 22.12+)
**Build**: `npm run build` (runs type-check + build)
**Linting**: `npm run lint` (ESLint with auto-fix)

**Environment Variables**: Configure `VITE_API_BASE_URL` in `.env` file to set the API server URL (defaults to `http://localhost:3000`).

**API Configuration**: `src/api/client.ts` configures axios with `baseURL` from `VITE_API_BASE_URL` environment variable. API service methods use full paths with `/api` prefix (e.g., `/api/auth/login`).

## Code Patterns & Conventions

**Store Pattern**: Use Pinia Composition API stores with `defineStore()` and `persist: true` for auth state. See `src/stores/auth.ts` for the template.

**API Services**: Organize API calls in `src/api/index.ts` by domain (authApi, userApi). All services use the configured `apiClient` from `src/api/client.ts` for automatic token handling. Use full paths with `/api` prefix in service methods.

**Component Structure**:

- Views in `src/views/` for route components
- Reusable components in `src/components/`
- Utilities in `src/utils/` (e.g., Gravatar helper)

**Form Handling**: Use Vuetify's `v-form` with validation rules as functions. See `src/views/LoginView.vue` for login patterns and `src/views/UserProfileView.vue` for in-place editing.

**Type Safety**: Import types from `src/api/types.ts`. Use `type` imports for TypeScript types and avoid `any` - prefer `unknown` or specific interfaces.

## Component Integration

**Vuetify Setup**: All Vuetify components and directives are globally available via `src/main.ts` setup. Use Material Design Icons (`mdi-*`) for consistency.

**User Avatar**: Use `getGravatarUrl()` from `src/utils/gravatar.ts` which handles email hashing and defaults for null emails.

**Error Handling**: Display user feedback with Vuetify's `v-snackbar`. API errors are typed as `AxiosError<ApiErrorResponse>` for proper error extraction.

**Editable Fields**: Use `src/components/EditableField.vue` for in-place editing with validation. Emits `update:value` events for parent handling.

## Key Files to Reference

- `src/stores/auth.ts` - Authentication state management pattern
- `src/api/client.ts` - Axios interceptors for token handling
- `src/router/index.ts` - Route guards and meta properties
- `src/views/UserProfileView.vue` - Complex form handling with API integration
- `src/components/AppToolbar.vue` - Role-based UI rendering patterns

## AI Assistant Guidelines

### Before Starting Work

- **If user prompt contains ambiguous information, STOP and confirm with user before coding**
- **Don't do extra work** - if user asks for implementation, don't implement tests unless requested
- **When implementing api without API documentation, STOP and confirm with user**
- **Leverage existing libraries** - Before implementing functionality, check if any well-known library or existing dependencies already provide the needed features. Avoid "reinventing the wheel" by using established solutions
- **Follow established patterns** - Adhere to the project's existing architectural and coding conventions for consistency and maintainability. Examine existing code to understand its pattern.
