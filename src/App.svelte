<script>
	import Welcome from './components/welcome/Welcome.svelte';
	import ProductGrid from './components/productGrid/ProductGrid.svelte';

	$: document.body.classList.add("flex", "flex-col", "w-screen", "min-h-screen", "p-10", "bg-gray-100", "text-gray-800");
</script>

<ProductGrid/>

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>