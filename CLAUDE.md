# Angular 21 Development Guidelines

## Stack & Tools

- **Framework**: Angular 21.2.5
- **Build**: @angular/build (v21)
- **UI**: Angular Material 19, Angular CDK
- **Backend**: Supabase
- **SSR**: Enabled with Express server
- **Styling**: SCSS

## Development Standards

### Component Architecture

- Use **Standalone Components** (no NgModules)
- Prefer **Signal-based** reactivity over RxJS when possible
- Use `input()` and `output()` signal APIs for component IO
- Enable `withComponentInputBinding()` for route-to-component data flow
- Use `withViewTransitions()` for smooth navigation

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule],
  template: `...`,
})
export class ExampleComponent {
  name = input.required<string>();
  changed = output<EventEmitter>();
}
```

### Services & Dependency Injection

- Use `providedIn: 'root'` for singleton services
- Prefer **functional guards** and **functional interceptors**
- Use `inject()` function over constructor injection when possible

```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
}
```

### HTTP & API Communication

- Use `provideHttpClient(withFetch())` for modern fetch API
- Create **functional interceptors** for auth/logging
- Strongly type all request/response models
- Handle errors at service layer, not component

### State Management

- Prefer **Signals** (`signal`, `computed`, `effect`) for local state
- Use Supabase realtime subscriptions for sync
- Keep component state minimal; delegate to services

### Routing

- Use **route-level code splitting** with lazy loading
- Bind route params via `withComponentInputBinding()`
- Use **route guards** as functions (`CanActivateFn`)

```typescript
const routes: Routes = [
  { path: 'products', loadComponent: () => import('./products') },
];
```

### Styling

- Use **SCSS** with Angular Material theming
- Leverage CSS custom properties for dynamic themes
- Co-locate styles with components (`styleUrl`)

### Testing

- Use **Jest** or **Karma** with Jasmine
- Test services in isolation with TestBed
- Prefer integration tests for critical flows
- Mock external dependencies (Supabase, HTTP)

## Project Structure

```
src/app/
├── core/                    # Singleton services, guards, interceptors
│   ├── guards/
│   ├── interceptors/
│   ├── models/
│   └── services/
├── features/                # Feature modules (lazy-loaded)
│   ├── auth/
│   └── products/
├── layout/                  # Shell, header, footer
├── shared/                  # Reusable components/pipes
└── app.config.ts           # App bootstrap
```

## Commands

```bash
# Development
npm start                    # ng serve --port 4200
npm run build                # Production build
npm run watch                # Dev watch mode

# Testing
npm test                     # Karma tests

# SSR
npm run serve:ssr            # Run SSR server
```

## Best Practices Checklist

- [ ] Strict TypeScript (`strict: true`)
- [ ] No `any` types; use proper interfaces
- [ ] Async pipe in templates (avoid manual subscribe)
- [ ] OnPush change detection where possible
- [ ] Deferrable views (`@defer`) for heavy components
- [ ] SSR-compatible code (no direct browser API in services)
- [ ] Environment-based configs (`environments/`)
- [ ] Error boundaries and user-friendly messages

## Common Patterns

### Signal Form Pattern
```typescript
form = signal({ name: '', email: '' });
valid = computed(() => this.form().name && this.form().email);
```

### Supabase Service Pattern
```typescript
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client = inject(SupabaseClient);

  async fetchProducts() {
    return await this.client.from('products').select();
  }
}
```

### Functional Guard Pattern
```typescript
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() || redirect('/login');
};
```
