---
description: Next.js App Router and Tailwind CSS UI standards
globs:
  - "apps/web/**/*"
  - "packages/ui/**/*"
  - "**/*.tsx"
  - "**/*.css"
alwaysApply: false
---

# UI Standards (Next.js & Tailwind)

## Next.js App Router

### File Conventions
- `page.tsx` - Route pages
- `layout.tsx` - Shared layouts
- `loading.tsx` - Loading UI
- `error.tsx` - Error boundaries
- `not-found.tsx` - 404 pages

### Server vs Client Components
```tsx
// Default to Server Components
// Add 'use client' only when needed:
// - useState, useEffect, event handlers
// - Browser APIs
// - Third-party client libraries
'use client'
```

### Data Fetching
- Fetch data in Server Components when possible
- Use TanStack Query for client-side fetching
- Implement proper loading and error states

## Tailwind CSS

### Design Tokens (Use CSS Variables)
```css
/* Primary Colors */
--primary-blue: #0099FF;
--primary-dark: #4A5568;
--accent-blue: #0080DD;
--light-blue: #E6F7FF;

/* Status Colors */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;

/* Neutral Colors */
--gray-50 through --gray-900

/* Dark Mode */
--dark-bg: #1F2937;
--dark-surface: #374151;
```

### Typography
- **Font Family:** Inter (Google Fonts)
- **Code:** JetBrains Mono
- **Headings:** font-semibold to font-bold (600-700)
- **Body:** font-normal (400)

### Component Patterns

#### Buttons
```tsx
// Use shadcn/ui Button with variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost</Button>
```

#### Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Responsive Design
- Mobile-first approach
- Breakpoints: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`
- Test on mobile devices

### Accessibility
- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation
- Maintain color contrast ratios (WCAG AA)

### Icons
- Use Lucide React exclusively
- Consistent sizing: `h-4 w-4`, `h-5 w-5`, `h-6 w-6`
```tsx
import { Ticket, Clock, User } from 'lucide-react'
```

## Form Handling
- Use React Hook Form for all forms
- Validate with Zod schemas
- Show inline validation errors
- Disable submit during loading

```tsx
const form = useForm<TicketFormData>({
  resolver: zodResolver(ticketSchema),
  defaultValues: { ... }
})
```

## State Management
- **Server State:** TanStack Query
- **Client State:** Zustand (minimal)
- **Form State:** React Hook Form
- Avoid prop drilling - use context or stores
