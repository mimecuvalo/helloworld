<h1 align="center">
  🔮 Project Name
</h1>
<blockquote align="center">
  Quick blurb.
</blockquote>

<p align="center">
  <a href="https://travis-ci.com/mimecuvalo/all-the-things-example"><img src="https://img.shields.io/travis/mimecuvalo/all-the-things-example.svg" alt="CI status" /></a>
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg" alt="prettier status" /></a>
  <a href="https://github.com/username/project/docs/license.md"><img src="https://img.shields.io/badge/license-MIT-brightgreen.svg" alt="license" /></a>
</p>

## 📯 Description

Write your stunning description here.

## 💾 Install

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) and [`all-the-things`](https://github.com/mimecuvalo/all-the-things).

```sh
yarn
```

_Prerequisites: Node 14+ if you want proper internationalization (i18n) support (via full-icu)._

## Getting Started

First, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

In dev or prod you'll want to setup your environment as well. Check out the `.env.example` file and `mv` it to `.env.development.local` (or `.env` for prod) and set the various variables:

- `NEXT_PUBLIC_DB*` for your database
- `NEXT_PUBLIC_SESSION_SECRET` for session management
- `NEXT_PUBLIC_AUTH0*` variables if you would like to use Auth0 for logging in

To run tests:

```sh
yarn test
```

To setup your DB:

```sh
cp prisma/.env.example prisma/.env
```

and set DATABASE_URL=postgresql://postgres:password@databasedomain.com:PORT/postgres

Then, to sync your DB:

```sh
npx prisma db push
```

To view your DB locally:

```sh
npx prisma studio
```

To learn more about Prisma, read the docs [here](https://www.prisma.io/).
Supabase is pretty great to get a good Postgres DB: https://app.supabase.io/

To add your name/email to relevant files:

```sh
yarn config
```

## 📙 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

### [Changelog](changelog.md)

### [Code of Conduct](code_of_conduct.md)

### [Contributing](contributing.md)

### [Contributors](contributors.md)

### [Support](support.md)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## 📜 License

[MIT](license.md)

(The format is based on [Make a README](https://www.makeareadme.com/))
