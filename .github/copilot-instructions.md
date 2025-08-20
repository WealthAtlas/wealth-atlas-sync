# GitHub Copilot Instructions for Wealth Atlas

## Project Overview

**Wealth Atlas** is a local-first React PWA for wealth management built with a Domain-Driven Design (DDD) architecture. The application emphasizes simplicity, maintainability, and clean code principles without over-engineering.

### Core Technology Stack

- **React 18.3** + **TypeScript 5** - Modern React with strict typing
- **Vite** - Fast development and build tooling
- **Vitest** - Fast unit testing framework integrated with Vite
- **Material-UI v5** - Component library for consistent UI
- **@mui/x-charts** - Material-UI charts for data visualization
- **Dexie v4** - IndexedDB wrapper for local-first data storage
- **React Router v6** - Client-side routing
- **PWA** - Progressive Web App capabilities

### Package Manager

- **pnpm** - Preferred package manager (specified in `package.json` as `packageManager: "pnpm@9.0.0"`)

## Core Development Principles

### 1. Easy Maintenance & Clear Separation

- **Maintainability First** - Code architecture prioritizes long-term maintainability over short-term convenience
- **Clear Boundaries** - Strict separation between domain, data, and application layers
- **Single Responsibility** - Each class, function, and module has one clear purpose

### 2. Self-Documenting Code

- **Code as Documentation** - Write code that is readable and self-explanatory
- **Minimal Comments** - Add comments only when code cannot be made self-explanatory
- **Meaningful Names** - Use descriptive variable, function, and class names that explain intent
- **Essential Comments Only** - Comment complex business logic, non-obvious algorithms, or external API quirks

### 3. Modern Clean Code Practices

- **Latest Design Patterns** - Always use current best practices and modern methodologies
- **No Legacy Patterns** - Avoid outdated approaches in favor of contemporary solutions
- **Clean Architecture** - Follow SOLID principles and clean code guidelines
- **Best Practices** - Apply industry-standard patterns and conventions

### 4. Container-Component Pattern (Strict Separation)

- **Page.tsx** - Pure presentational components for UI rendering only
- **Container.tsx** - Smart components handling data fetching and business logic
- **Clear Responsibilities** - Containers never handle presentation, components never handle data

### 5. Layer-Specific Logic Placement

- **Domain Logic** - All business rules, calculations, and domain operations in `src/domain/`
- **Database Logic** - All data access, persistence, and database operations in `src/data/`
- **Application Logic** - UI state, routing, and component orchestration in `src/app/`

### 6. Strategic Testing (Test Pyramid)

- **Complex Business Logic Only** - Unit tests for critical domain calculations (IRR analysis, growth rates, inflation, loan metrics)
- **Financial Calculations** - Comprehensive testing for IRR calculations, Newton-Raphson method convergence, and loan analytics
- **No Presentation Tests** - Skip testing for UI components and presentation layer
- **No Data Layer Tests** - Skip testing for repositories and database operations
- **Focus on Value** - Test only the most complex and critical business logic
- **Test Framework** - Use Vitest for fast unit testing with excellent TypeScript support

### 7. Strict Type Safety

- **No `any` Types** - Avoid `any` at all costs; use proper TypeScript types
- **Explicit Types** - Define clear interfaces and types for all data structures
- **Type Guards** - Use type guards for runtime type checking when necessary
- **Generic Constraints** - Leverage TypeScript's type system for compile-time safety

### 8. Material-UI Design System

- **Material-UI Only** - Use Material-UI components exclusively for all UI elements
- **No Custom CSS** - Avoid writing custom CSS; use Material-UI's styling solutions
- **Theme System** - Leverage Material-UI's theming for consistent design
- **Component Library** - Build upon Material-UI's component ecosystem

### 9. Responsive Design Priorities

- **Essential Support** - Tablet and laptop screens are mandatory
- **Mobile Compatibility** - Mobile support is preferred but not required
- **Desktop First** - Optimize primarily for desktop/laptop experience
- **Progressive Enhancement** - Ensure core functionality works across all supported devices

## Architecture Principles

### Domain-Driven Design (DDD)

The project follows a clean DDD architecture with clear separation of concerns:

```
src/
├── domain/           # Pure business logic (entities, value objects, services)
│   ├── entities/     # Domain entities organized by bounded context
│   │   ├── assets/   # Asset management domain
│   │   ├── expenses/ # Expense tracking domain
│   │   ├── loans/    # Loan management domain
│   │   ├── goals/    # Goal planning domain
│   │   └── shared/   # Cross-domain entities (Currency, etc.)
│   ├── services/     # Domain services and business logic
│   └── value-objects/ # Domain value objects
├── data/             # Data access layer (repositories, database)
└── app/              # Application layer (components, containers, routing)
```

### Key Architectural Rules

1. **Domain Layer** (`src/domain/`)
   - **Entities** (`src/domain/entities/`) - Organized by bounded context:
     - `assets/` - Asset management entities (Asset, AssetTransaction, AssetCategory)
     - `expenses/` - Expense tracking entities (Expense, ExpenseCategory)
     - `loans/` - Loan management entities (Loan, LoanPayment, PaymentSchedule, PaymentFrequency)
     - `goals/` - Goal planning entities (Goal, AssetGoalAllocation)
     - `shared/` - Cross-domain entities (Currency, etc.)
   - **Services** (`src/domain/services/`) - Domain services and business logic
   - **Value Objects** (`src/domain/value-objects/`) - Domain value objects
   - Contains pure business entities and logic with no external dependencies
   - Entities should evolve from interfaces to classes with business methods

2. **Data Layer** (`src/data/`)
   - **Repositories** (`src/data/repositories/`) - Data access using domain interfaces directly
   - **Database** (`src/data/database.ts`) - Simple Dexie configuration for local storage
   - **No Timestamps** - Clean interfaces without audit fields for personal use

3. **Application Layer** (`src/app/`)
   - **Components** - Pure presentational React components
   - **Containers** - Smart components that handle business logic
   - **Hooks** - Reusable React hooks for state and side effects
   - **Router** - Application routing configuration
   - **Theme** - Material-UI theme and styling

### Container-Presentational Pattern

Follow the strict container-component separation:

- **Page.tsx Components** (`src/app/components/`) - Pure presentational components responsible for:
  - UI rendering and layout
  - Receiving props from containers
  - Event delegation to container handlers
  - Zero business logic or data fetching

- **Container.tsx Components** (`src/app/containers/`) - Smart components responsible for:
  - Data fetching and state management
  - Business logic orchestration
  - Event handling and data manipulation
  - Passing processed data to presentation components

## Code Quality Standards

### ESLint Configuration

- Uses **ESLint 9.x** with **flat config** (`eslint.config.mjs`)
- TypeScript + React + Prettier integration
- Strict rules for clean code, no unused variables, prefer const over var
- React-specific rules with React 18.3 settings

### Prettier Formatting

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "lf",
  "arrowParens": "avoid",
  "bracketSpacing": true,
  "jsxSingleQuote": false
}
```

### TypeScript Configuration

- **Strict mode enabled** with comprehensive linting rules
- **ES2020 target** with modern JavaScript features
- **Path mapping** configured (`@/*` → `src/*`)
- **React JSX transform** for automatic React imports

### Quality Scripts

- `pnpm run quality` - Runs type-check, lint, and format:check
- `pnpm run lint:fix` - Auto-fix ESLint issues
- `pnpm run format` - Auto-format code with Prettier
- `pnpm test` - Run unit tests with Vitest
- `pnpm test:ui` - Run tests with interactive UI
- `pnpm test:run` - Run tests once without watch mode

## Development Patterns

### Repository Pattern Implementation

Follow the simplified repository pattern using domain interfaces directly:

````typescript
```typescript
export class AssetRepository {
  // Private mapping methods for DRY principle
  private toDomain(record: IAsset): Asset {
    return new Asset(/* map all business fields */);
  }
  private toRecord(asset: Asset): Omit<IAsset, 'id'> {
    return { /* only business fields */ };
  }

  // Standard CRUD operations
  async findAll(): Promise<Asset[]> { /* ... */ }
  async findById(id: number): Promise<Asset | null> { /* ... */ }
  async save(asset: Asset): Promise<Asset> { /* ... */ }
  async delete(id: number): Promise<void> { /* ... */ }
}
````

````

### Database Design Patterns

1. **Simple Schema** - Direct use of domain interfaces without audit fields
2. **Schema Versioning** - Proper Dexie version management for database migrations
3. **Domain Interface as Schema** - Use `IAsset`, `IAssetTransaction` directly as Dexie table types
4. **Personal Use Focus** - No monitoring or audit trails needed for single-user app

### Entity Evolution Pattern

Entities start as interfaces and evolve to classes:

```typescript
// Current: Interface with clean business fields
export interface IAsset {
  id?: number;
  name: string;
  description: string;
  category: AssetCategory;
  currency: string;
  currentMarketValue: number | undefined;
  valueUpdatedAt: Date | undefined;
}

// Future: Enhanced with Currency enum
export interface IExpense {
  id?: number;
  amount: number;
  currency: string; // Uses Currency enum values (USD, GBP, INR)
  date: Date;
  category: ExpenseCategory;
  isEssential: boolean;
  description: string;
}

// Domain class implementing the interface
export class Asset implements IAsset {
  constructor(/* all fields */) {
    this.validateName();
  }

  private validateName(): void {
    /* validation logic */
  }
  getTotalInvestedAmount(transactions: AssetTransaction[]): number {
    /* business logic */
  }
  getCurrentHoldings(transactions: AssetTransaction[]): number {
    /* business logic */
  }
  getProfitLoss(transactions: AssetTransaction[]): number | undefined {
    /* business logic */
  }
}
````

### Wealth Management Domain Patterns

#### Asset & Transaction Model

- **Assets** represent investable items (stocks, real estate, mutual funds, FDs, gold, etc.)
- **Transactions** track buy/sell activities with quantity (optional) and unit price
- **No Computed Storage** - Calculate portfolio metrics at runtime
- **Money-First Approach** - Always prioritize monetary tracking over quantity

#### SIP (Systematic Investment Plan) Model

- **Scheduled Asset Transactions** represent recurring investment plans for assets
- **Auto-Conversion Pattern** - Follows loan payment pattern for converting scheduled to actual transactions
- **Investment Frequency** - Support for monthly, quarterly, semi-annual, and annual investments
- **Progress Tracking** - Monitor total invested vs expected investment amounts
- **SIP Lifecycle Management** - Create, edit, pause/resume, and delete SIPs with transaction preservation options
- **Application Startup Auto-Conversion** - Automatically processes due SIPs when application opens

#### Expense Tracking Model

- **Expenses** represent personal expenditures with categorization and analytics
- **Monthly Grouping** - Expenses are organized by month with expandable sections
- **Multi-Currency Support** - Expenses support different currencies using Currency enum
- **Category Classification** - Expenses are categorized (FOOD, TRANSPORT, HOUSING, etc.)
- **Essential vs Non-Essential** - Track whether expenses are essential or discretionary
- **Scheduled Expenses** - Recurring expenses that auto-generate actual expense records

#### Scheduled Expense Model

- **Scheduled Expenses** represent recurring expense patterns for auto-generation of actual expenses
- **Auto-Generation Pattern** - Follows loan payment pattern for converting scheduled to actual expenses
- **Expense Frequency** - Support for daily, weekly, monthly, quarterly, semi-annual, and annual expenses
- **Application Startup Auto-Conversion** - Automatically processes due scheduled expenses when application opens
- **Optional End Date** - Scheduled expenses can run indefinitely or until a specified end date
- **Future-Only Editing** - Changes to scheduled expenses only affect future generated expenses
- **Clear Attribution** - Generated expenses include "Generated from: [Schedule Name]" in description

#### Loan Management Model

- **Loans** represent borrowed money with payment tracking and financial analysis
- **Payment Schedule** - Automated generation of scheduled payments with configurable frequency
- **Payment Tracking** - Mark payments as paid/unpaid with overdue detection
- **IRR Analysis** - Advanced Internal Rate of Return calculations using Newton-Raphson method
- **Financial Metrics** - Comprehensive loan analytics including effective interest rates, risk assessment, and payment history
- **Payment-First Model** - Focus on actual payment tracking rather than theoretical schedules

#### Key Business Rules

1. **Store Raw Data Only** - Never store computed values that can be calculated
2. **Unit Price Storage** - Store unit price including fees, not separate fee fields
3. **Optional Quantity** - Some assets (FDs, bonds) don't have meaningful quantity concept
4. **Explicit Transaction Types** - Use `buy`/`sell` rather than positive/negative amounts
5. **Market Value Separation** - `currentMarketValue` is manually updated or API-fetched

#### Expense Management Rules

1. **Monthly Organization** - Group expenses by month for historical analysis
2. **Currency Consistency** - Use Currency enum for standardized currency handling
3. **Category Classification** - Mandatory expense categorization for analytics
4. **Essential Tracking** - Distinguish between essential and discretionary spending
5. **Real-time Analytics** - Calculate monthly totals and trends dynamically

#### Scheduled Expense Management Rules

1. **Schedule-First Approach** - Focus on scheduled expense tracking with automatic conversion to actual expenses
2. **Auto-Conversion Logic** - Convert due scheduled expenses to actual expenses on application startup
3. **Future-Only Editing** - When editing scheduled expenses, changes only affect future generated expenses
4. **Optional End Date** - Scheduled expenses can run indefinitely or until a specified end date
5. **Separate Management** - Dedicated "Scheduled Expenses" dialog for viewing and managing recurring expenses
6. **Clear Attribution** - Generated expenses show origin schedule in description for transparency
7. **Frequency Support** - Daily, weekly, monthly, quarterly, semi-annual, and yearly scheduling options

#### Loan Management Rules

1. **Payment-First Approach** - Focus on actual payment tracking over theoretical calculations
2. **Automated Scheduling** - Generate payment schedules with configurable frequency (monthly, quarterly, etc.)
3. **IRR Calculation** - Use Newton-Raphson method for accurate Internal Rate of Return analysis
4. **Risk Assessment** - Categorize loans by risk level (LOW/MEDIUM/HIGH) based on payment history and rates
5. **Cash Flow Analysis** - Build comprehensive cash flow models for accurate financial metrics
6. **Overdue Detection** - Automatic identification of missed payments with aging analysis

#### SIP Management Rules

1. **Schedule-First Approach** - Focus on scheduled investment tracking with automatic conversion to actual transactions
2. **Auto-Conversion Logic** - Convert due scheduled investments to actual transactions on application startup
3. **Edit with History** - When editing SIPs, automatically create actual transactions for past due dates
4. **Pause/Resume Capability** - Toggle SIP active status without losing configuration or transaction history
5. **Flexible Deletion** - Option to keep or remove existing transactions when deleting SIPs
6. **Progress Analytics** - Track total invested vs expected investment amounts with completion status
7. **Investment Frequency Support** - Monthly, quarterly, semi-annual, and annual scheduling options

#### Goal Management Model

- **Goals** represent financial objectives with target amounts, maturity dates, and inflation adjustments
- **Asset-Goal Allocations** track percentage-based allocation of assets to specific goals
- **Progress Tracking** - Real-time calculation of goal achievement probability using asset IRR
- **Multi-Asset Support** - Single goals can have allocations from multiple assets
- **Currency Independence** - Goals have independent currency settings with future conversion support

#### Goal Management Rules

1. **Simple Goal Structure** - Flat goal hierarchy without categories or sub-goals
2. **Static Percentage Allocation** - User-defined fixed percentages, no automatic adjustments
3. **Over-allocation Allowed** - Intentional buffer allocation beyond 100% for conservative planning
4. **Inflation-Adjusted Targeting** - Dynamic calculation of inflation-adjusted target amounts
5. **Progress Visualization** - Multi-color progress bars (green/yellow/red) based on achievement probability
6. **Asset Integration** - Simple count display showing goal allocation count per asset
7. **Currency Flexibility** - Independent goal currency with placeholder for future conversion logic
8. **Allocation Validation** - Strict 1-100% range validation with form submission blocking
9. **Real-time Updates** - Automatic progress recalculation when asset values change
10. **Clean Deletion** - Goal deletion removes all associated allocations without impact warnings

#### Asset Management Rules

1. **Comprehensive Deletion** - Asset deletion removes associated transactions and scheduled investments (SIPs)
2. **Data Integrity** - Proper cleanup of all related data when assets are deleted
3. **User Confirmation** - Clear warnings about permanent deletion and data loss
4. **Streamlined UI** - Remove redundant actions (transaction creation available in transaction list dialog)

#### Portfolio Calculations (Runtime)

- **Total Invested** - Sum of (quantity × price) for all buy transactions minus sells
- **Current Holdings** - Sum of quantities bought minus quantities sold
- **Current Value** - Current holdings × current market value per unit
- **Profit/Loss** - Current value minus total invested amount

## File Naming Conventions

### Directory Structure

- **PascalCase** for components: `HomePage.tsx`, `HomeContainer.tsx`
- **camelCase** for utilities and hooks: `useAuth.ts`, `database.ts`
- **PascalCase** for entities and records: `Asset.ts`, `AssetRecord.ts`

### Component Organization

- **Forms** (`src/app/components/Forms/`) - Reusable form dialog components
  - `AssetFormDialog.tsx` - Asset creation/editing form
  - `TransactionFormDialog.tsx` - Transaction creation/editing form
  - `ExpenseFormDialog.tsx` - Expense creation/editing form
  - `ScheduledExpenseFormDialog.tsx` - Scheduled expense creation/editing form
  - `LoanFormDialog.tsx` - Loan creation/editing form
  - `PaymentFormDialog.tsx` - Payment creation/editing form
- **Dialogs** (`src/app/components/Dialogs/`) - Modal dialog components
  - `TransactionListDialog.tsx` - Transaction listing and management
  - `ScheduledExpenseListDialog.tsx` - Scheduled expense listing and management
  - `PaymentListDialog.tsx` - Payment listing and management
  - `IRRAnalysisDialog.tsx` - Detailed IRR analysis display
- **Pages** (`src/app/components/Pages/`) - Page-level presentational components
- **Containers** (`src/app/containers/`) - Smart components with business logic
  - `AssetsContainer.tsx` - Main orchestration for assets and transactions
  - `TransactionFormContainer.tsx` - Transaction form business logic
  - `TransactionListContainer.tsx` - Transaction list business logic
  - `ExpensesContainer.tsx` - Expense management and analytics
  - `ExpenseFormContainer.tsx` - Expense form business logic
  - `ScheduledExpenseContainer.tsx` - Scheduled expense management and orchestration
  - `LoansContainer.tsx` - Loan management and IRR analysis orchestration
  - `LoanFormContainer.tsx` - Loan form business logic
  - `PaymentFormContainer.tsx` - Payment form business logic
  - `PaymentListContainer.tsx` - Payment list business logic

### Import Organization

1. React and external libraries first
2. Internal domain imports
3. Internal data layer imports
4. Relative imports last
5. Use path mapping `@/*` when beneficial

### Domain Import Patterns

With the organized domain structure, use these import patterns:

```typescript
// Asset domain imports
import { Asset } from '@/domain/entities/assets/Asset';
import { AssetCategory } from '@/domain/entities/assets/AssetCategory';
import { AssetTransaction } from '@/domain/entities/assets/AssetTransaction';

// Expense domain imports
import { Expense } from '@/domain/entities/expenses/Expense';
import { ExpenseCategory } from '@/domain/entities/expenses/ExpenseCategory';
import { ScheduledExpense } from '@/domain/entities/expenses/ScheduledExpense';

// Loan domain imports
import { Loan } from '@/domain/entities/loans/Loan';
import { LoanPayment } from '@/domain/entities/loans/LoanPayment';
import { PaymentSchedule } from '@/domain/entities/loans/PaymentSchedule';
import { PaymentFrequency } from '@/domain/entities/loans/PaymentFrequency';

// Goal domain imports
import { Goal } from '@/domain/entities/goals/Goal';
import { AssetGoalAllocation } from '@/domain/entities/goals/AssetGoalAllocation';

// Shared domain imports
import { Currency } from '@/domain/entities/shared/Currency';

// Domain services
import { PortfolioService } from '@/domain/services/PortfolioService';
import { IRRAnalysisService } from '@/domain/services/IRRAnalysisService';
import { GoalPlanningService } from '@/domain/services/GoalPlanningService';
import { ScheduledExpenseService } from '@/domain/services/ScheduledExpenseService';
```

## Development Workflow

### Scripts Usage

- `pnpm dev` - Start development server (localhost:3000)
- `pnpm build` - Production build with TypeScript compilation
- `pnpm test` - Run unit tests in watch mode
- `pnpm test:ui` - Run tests with interactive Vitest UI
- `pnpm test:run` - Run tests once without watch mode
- `pnpm run quality` - **Run before commits** to ensure code quality
- `pnpm run lint:fix && pnpm run format` - Auto-fix common issues

### VS Code Integration

- **Auto-format on save** with Prettier
- **ESLint integration** with auto-fix on save
- **Consistent indentation** (2 spaces, no tabs)
- **Import organization** on save

### PWA Configuration

- Uses `vite-plugin-pwa` for service worker generation
- Auto-update registration type
- Workbox for caching strategies

## Sync (Encrypted, Local-First)

Goal: simple, maintenance-first encrypted sync for a personal app.

- Model: client-only encryption/decryption; server stores opaque blobs.
- Conflict: last-writer-wins (no server-side conflict logic, no compression, no client history).
- Passphrase: derive key via PBKDF2-SHA256; never store passphrase.

Implementation locations:

- `src/data/sync/crypto.ts` – Web Crypto helpers (PBKDF2-SHA256 + AES-256-GCM)
- `src/data/sync/SyncService.ts` – export/import Dexie snapshot, encrypt/decrypt, call API
- `src/data/sync/types.ts` – Snapshot, SyncStatus, RemoteDataResponse
- `src/data/sync/state.ts` – localStorage helpers: keyId, lastRemoteVersion, lastSyncAt

Snapshot payload (encrypted JSON):

- `{ schemaVersion: <Dexie version>, data: { assets, assetTransactions, scheduledAssetTransactions, expenses, scheduledExpenses, loans, paymentSchedules, loanPayments, goals, assetGoalAllocations } }`
- Uses current Dexie `database.ts` version (e.g., 7). Import clears then bulkPut in dependency order.

Crypto meta (stored with payload, non-secret):

- `{ enc: 'AES-GCM', kdf: 'PBKDF2-SHA256', iterations: ~250000, salt: base64(16B), iv: base64(12B), schemaVersion }`

API contract (last-writer-wins):

- `POST /data` → create dataset; returns `{ keyId, version: 1 }`
- `GET /data/:keyId` → latest `{ keyId, version, payload, meta, updatedAt }`
- `PUT /data/:keyId` → store `{ payload, meta }`, server increments version; returns `{ keyId, version }`
- `DELETE /data/:keyId` (optional) → remove dataset

Settings UI (container-presentational):

- Presentational: `SettingsPage.tsx` renders sync controls (Setup, Link, Push, Pull, Change Passphrase, Unlink)
- Container: `SettingsContainer.tsx` calls `SyncService` and shows simple alerts on errors

Config & Hosting:

- Frontend: static on GitHub Pages.
- Backend: host API separately (e.g., Cloudflare Workers). Set API base URL in a small config if not `/data`.

## AI Coding Guidelines

### When Adding New Features

1. **Start with Domain** - Define entities and business logic first
2. **Extend Interface** - Add optional database fields to domain interface if needed
3. **Implement Repository** - Handle data access with proper mapping
4. **Build Container** - Create smart component for business logic
5. **Add Presentation** - Create pure component for UI rendering
6. **Update Router** - Add new routes if needed

### Testing Patterns

The project follows strategic testing focused on complex business logic:

1. **Test Structure** - Place tests in `__tests__` folders adjacent to source files
   - `src/domain/services/__tests__/` for service logic tests
   - Use descriptive test names that explain business scenarios
2. **Test Content Focus**:
   - **Financial Calculations** - IRR analysis, Newton-Raphson convergence, loan metrics
   - **Business Logic Validation** - Entity validation, payment scheduling, expense scheduling, risk assessment
   - **Edge Cases** - Small amounts, overpayments, future dates, invalid data, infinite recurring schedules
3. **Test Organization**:
   - Group related tests with `describe` blocks
   - Use `beforeEach` for common test setup
   - Test both success and failure scenarios
   - Include edge cases and boundary conditions
4. **Vitest Configuration**:
   - Integrated with Vite for fast test execution
   - Global test utilities available
   - Support for TypeScript without additional configuration

### Transaction Management Pattern

The project implements a comprehensive transaction management system:

1. **Transaction Creation/Editing** - `TransactionFormDialog.tsx` + `TransactionFormContainer.tsx`
   - Supports both add and edit modes via `transactionToEdit` prop
   - Form pre-populates when editing existing transactions
   - Handles validation and business logic in container
2. **Transaction Listing** - `TransactionListDialog.tsx` + `TransactionListContainer.tsx`
   - Displays all transactions for a specific asset
   - Provides actions for editing and deleting transactions
   - Handles data loading and management operations
3. **Multi-Dialog Coordination** - `AssetsContainer.tsx`
   - Orchestrates between asset forms, transaction forms, and transaction lists
   - Manages state transitions between dialogs (e.g., from list to edit form)
   - Ensures data consistency across all operations

### Component Interaction Patterns

- **Form Dialog Pattern** - Reusable forms that support both create and edit modes
- **List Management Pattern** - Dedicated containers for complex list operations
- **Dialog Orchestration** - Parent containers coordinate multiple dialog states
- **Data Flow** - Containers handle all data operations, components handle presentation

### UI Layout Patterns

The project follows consistent layout patterns across all main pages:

1. **Main Layout Integration** - All primary pages must render through `MainContainer` and `MainLayout`
   - Routes in `AppRouter.tsx` should use `MainContainer` for dashboard, assets, loans, expenses, and goals
   - This ensures consistent app bar, bottom navigation, and page structure
   - Settings and utility pages can use direct containers for full-screen experiences

2. **Page Container Standards** - All main pages follow consistent styling patterns
   - Container padding: `sx={{ p: 3, pb: 10 }}` (3 units padding, 10 bottom for nav clearance)
   - Loading states: Centered `CircularProgress` with `height: 'calc(100vh - 200px)'`
   - Page headers: `Typography variant="h4" component="h1"` with consistent title naming

3. **Floating Action Button (FAB)** - Primary actions use consistent FAB placement
   - Position: `{ position: 'fixed', bottom: 80, right: 16 }` (above bottom navigation)
   - Use for main page actions (Add Asset, Create Goal, etc.)
   - Supplement empty state CTAs rather than replace them

4. **Tab State Synchronization** - `MainPage` maintains navigation state consistency
   - Tab selection syncs with URL changes via `useEffect` on `location.pathname`
   - Enables deep linking and proper navigation state for direct page access
   - Router navigation updates both URL and tab selection simultaneously

### Loan Management Pattern

The project implements a comprehensive loan management system:

1. **Loan Creation/Editing** - `LoanFormDialog.tsx` + `LoanFormContainer.tsx`
   - Supports both add and edit modes with loan validation
   - Handles principal amount, interest rates, and payment schedules
   - Integrates with automated payment generation
2. **Payment Management** - `PaymentFormDialog.tsx` + `PaymentListDialog.tsx`
   - Track individual payments with paid/unpaid status
   - Automatic overdue detection and aging analysis
   - Support for manual payment entry and bulk operations
3. **IRR Analysis** - `IRRAnalysisDialog.tsx` + `IRRAnalysisService.ts`
   - Advanced Internal Rate of Return calculations using Newton-Raphson method
   - Risk assessment with LOW/MEDIUM/HIGH categorization
   - Interactive displays with progressive disclosure (card → tooltip → detailed dialog)
   - Comprehensive financial metrics including EAR, monthly rates, and reliability scoring
4. **Payment Scheduling** - `PaymentSchedule` entity with automated generation
   - Configurable payment frequencies (monthly, quarterly, etc.)
   - Automatic conversion of scheduled to actual payments
   - Smart date handling with business day adjustments

### When Refactoring

1. **Preserve Architecture** - Maintain DDD boundaries
2. **Extract Business Logic** - Move from containers to domain entities
3. **Apply DRY Principle** - Use private methods for common patterns
4. **Update Tests** - Ensure quality scripts pass

### When Debugging

1. **Check Quality** - Run `pnpm run quality` first
2. **Verify Timestamps** - Database hooks should auto-manage timestamps
3. **Validate Mapping** - Ensure repository mapping between domain/records
4. **Review Dependencies** - Domain should not depend on external libraries

### Code Review Checklist

- [ ] Follows DDD architecture principles
- [ ] Uses established container-presentational pattern
- [ ] Includes proper TypeScript types
- [ ] Has private mapping methods in repositories
- [ ] Uses domain interfaces directly (no separate record types)
- [ ] Passes `pnpm run quality` checks
- [ ] Uses consistent naming conventions
- [ ] Maintains clean import organization

## Common Anti-Patterns to Avoid

❌ **Don't:**

- Import external libraries in domain entities
- Mix database concerns with business logic
- Use `any` type without justification
- Skip the repository pattern for data access
- Put business logic in React components
- Use `var` instead of `const`/`let`
- Ignore ESLint warnings
- Write custom CSS instead of using Material-UI
- Add unnecessary comments for self-explanatory code
- Use outdated or legacy design patterns
- Test presentation layer or data layer components
- Put domain logic in containers or data logic in components
- Create separate record interfaces when domain interfaces suffice
- Store computed portfolio values in the database
- Use negative amounts instead of explicit buy/sell transaction types
- Store total invested amounts or profit/loss in Asset entities
- Create forms without supporting both add and edit modes
- Mix transaction management logic across multiple containers
- Skip dialog state coordination in parent containers
- Use text inputs for currency fields instead of Currency enum dropdowns
- Store computed expense totals instead of calculating them at runtime
- Mix essential and non-essential expenses without proper categorization
- Store computed loan metrics instead of calculating IRR at runtime
- Use separate payment tracking systems instead of unified LoanPayment entities
- Skip IRR analysis for loan interest rate calculations
- Ignore payment scheduling automation in favor of manual entry only
- Mix theoretical loan calculations with actual payment tracking
- Use simple interest calculations instead of IRR for loan analysis
- Skip risk assessment in loan management
- Store computed interest rates instead of calculating from payment history
- Store computed expense totals instead of calculating them at runtime
- Mix essential and non-essential expenses without proper categorization
- Skip scheduled expense auto-generation in favor of manual entry only
- Store computed recurring expense totals instead of calculating at runtime
- Import entities from old flat paths (use the new organized structure)
- Mix domain concerns across bounded contexts (assets, expenses, loans, shared)
- Route main pages directly to containers instead of through `MainContainer`
- Use inconsistent page padding or loading state patterns across main pages
- Place floating action buttons in non-standard positions or skip them on main pages
- Allow tab state to become desynchronized with the current URL/route

✅ **Do:**

- Keep domain layer pure from external dependencies
- Use repository pattern for all data access
- Separate concerns between containers and components
- Apply DRY principle with private methods
- Follow established naming conventions
- Maintain strict TypeScript configuration
- Run quality checks before commits
- Use Material-UI components exclusively for UI
- Write self-documenting code with meaningful names
- Apply modern clean code practices and latest design patterns
- Test only complex business logic (calculations, algorithms)
- Place logic in appropriate layers (domain, data, application)
- Use domain interfaces directly for database schemas when possible
- Calculate portfolio metrics at runtime from raw transaction data
- Store unit prices including fees rather than separate fee fields
- Make quantity optional for assets where it doesn't apply (FDs, bonds)
- Create form dialogs that support both create and edit modes via props
- Use dedicated containers for complex list operations (TransactionListContainer)
- Implement proper dialog orchestration in parent containers (AssetsContainer)
- Follow the established transaction management patterns for consistency
- Use Currency enum for all currency-related fields with dropdown selection
- Implement monthly grouping for time-based data organization
- Calculate analytics and totals at runtime rather than storing computed values
- Implement scheduled expense auto-generation following the established patterns
- Use clear attribution for auto-generated expenses from scheduled sources
- Follow the PaymentSchedule pattern for recurring expense management
- Use comprehensive IRR analysis for accurate loan interest rate calculations
- Implement unified payment tracking with LoanPayment entities
- Leverage Newton-Raphson method for precise IRR calculations
- Automate payment scheduling with configurable frequencies
- Separate actual payment tracking from theoretical loan calculations
- Use IRR-based analysis for professional-grade loan management
- Include risk assessment in all loan analysis workflows
- Calculate interest rates dynamically from payment history and cash flows
- Use the organized domain structure with proper bounded contexts (assets/, expenses/, loans/, shared/)
- Follow established import patterns for the new domain organization
- Route main pages through `MainContainer` to ensure consistent layout and navigation
- Use consistent page container styling with proper padding and loading states
- Implement floating action buttons (FAB) for primary page actions with standard positioning
- Maintain tab state synchronization between URL and navigation in `MainPage`

## Future Evolution

### Planned Enhancements

1. **Entity Classes** - Convert interfaces to classes with business methods
2. **Value Objects** - Add domain value objects for complex data types
3. **Advanced Repositories** - Implement query patterns and specifications
4. **State Management** - Consider Zustand for complex application state
5. **Testing** - Add comprehensive unit and integration tests

### Scalability Considerations

- **Modular Architecture** - Easy to add new domains (portfolios, transactions, etc.)
- **Clean Boundaries** - Well-defined layers for maintainability
- **Local-First** - IndexedDB provides offline-first capabilities
- **PWA Ready** - Progressive enhancement for mobile experience

---

_This document should be updated as the project evolves and new patterns emerge._
