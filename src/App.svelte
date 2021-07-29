<script>
	import Welcome from './components/welcome/Welcome.svelte';
  import Navbar from './components/Navbar.svelte'
  import Header from './components/Header.svelte';
  import Footer from './components/Footer.svelte';
	import ProductGrid from './components/productGrid/ProductGrid.svelte';


	$: document.body.classList.add("flex", "flex-col", "w-screen", "min-h-screen", "p-10", "bg-gray-100", "text-gray-800");
</script>

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  a {color: #fbbf24;}         /* Unvisited link  */
  a:visited {color:#fbbf24;} /* Visited link    */
</style>

<Header />
<ProductGrid/>
<Footer />
