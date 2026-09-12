# WorkPilot frontend instructions

- Use Next.js App Router and TypeScript.
- Keep routes under `src/app`; route groups `(auth)` and `(dashboard)` do not appear in URLs.
- The UI is light mode only unless the product requirements change.
- Put shared layout components in `src/components/layout`, feature components in `src/components/<feature>`, API clients in `src/services`, and reusable types/schemas in their dedicated folders.
- Do not add backend business features or database models unless explicitly requested.
- Before changing Next.js conventions, read the matching local Next.js documentation in `node_modules/next/dist/docs`.
