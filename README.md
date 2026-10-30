# VELMONT

An editorial storefront concept for the fictional VELMONT Swiss watch maison.

## Run locally

```bash
npm install
npm run dev
```

The app uses Next.js App Router, TypeScript, Tailwind CSS 4, Framer Motion and Lucide React. `npm run build` creates a production build; `npm run start` serves it.

## Pages and interactions

- `/` — cinematic home page and editorial stories
- `/watches` — collection catalog with collection filters
- `/watches/[slug]` — individual watch details, generated from the shared catalog data
- `/collections`, `/our-story`, `/watchmaking`, `/contact`
- Search overlay, desktop dropdown navigation, responsive mobile menu, scroll reveals, page transitions, and a contact form that prepares an email draft in the visitor’s mail app

Watch and editorial photography is loaded from Unsplash image URLs; the URLs request responsive, compressed formats. Replace the entries in `lib/watches.ts` and the editorial image references in `app/page.tsx` with approved brand photography before public launch. The enquiry form uses `mailto:` because no CRM or email service credentials were provided.

## Supabase watch management

The `/admin` workspace uses Supabase Auth, the PostgREST Data API, and Supabase Storage from server-only modules. It does not require a service-role key or an additional browser database SDK.

1. Copy `.env.example` to `.env.local` and set `SUPABASE_URL` and `SUPABASE_ANON_KEY`. These are read only by server code; do not prefix them with `NEXT_PUBLIC_`.
2. Run `supabase/setup.sql` in the Supabase SQL Editor. It enables public read access for watch rows, restricts edits and image writes to JWTs with the server-managed `app_metadata.role = admin` claim, creates the `watch-images` bucket, and seeds the six watches already used by the site.
3. Create an administrator through Supabase Auth. In the SQL editor, grant that user access by setting the admin claim, replacing the email:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'admin@example.com';
   ```

4. Sign out and back in, then open `/admin`.

The dashboard supports adding, editing, availability changes, confirmation-gated deletion, and up to eight JPG, PNG, or WebP images per watch. Public pages and product search read the same database, so edits appear on the next request. Admin auth uses HTTP-only cookies with refresh-token rotation in the Next.js proxy. A live Supabase project and admin account are required to exercise database CRUD and storage end to end.
