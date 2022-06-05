# Svelte Example

This directory is a brief example of a [Svelte](https://svelte.dev/) site that can be deployed with Vercel and zero-configuration. If you need to use API Routes, we recommend using our [SvelteKit example](https://github.com/vercel/vercel/tree/main/examples/sveltekit).

## Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel/vercel/tree/main/examples/svelte&template=svelte)

_Live Example: https://svelte.examples.vercel.com_

## Getting Started

```bash
npx degit sveltejs/template svelte-app
npm install
```

Then, start [Rollup](https://rollupjs.org):

```bash
vercel dev
```

Navigate to [localhost:3000](http://localhost:3000). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.


## Notes 

There's sometimes an issue that means the `vercel dev` command doesn't work on mac. To fix this removing the `::1 localhost` line from `/etc/hosts` file should fix the issue.


