<script>
    import { onMount } from "svelte";    
    import ProductTile from './ProductTile.svelte';
    import EmailModal from './emailModal.svelte';
    import ErrorModal from './errorModal.svelte';
    import SuccessModal from './successModal.svelte';

    let promise = Promise.resolve([]);

    async function getProducts() {
        return await fetch("/api/getProducts")
        .then(response => response.json())
		.catch(error => {
			console.log(error);
            throw error();
		});
    }

    onMount(() => {
        promise = getProducts();
    });

</script>

<EmailModal/>
<ErrorModal/>
<SuccessModal/>

<section>
    <!-- Product Grid-->
    <div class="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3">
        {#await promise}
            <p>Loading...</p> 
        {:then products}
            {#each products.products as product}
                <ProductTile {...product}/>
            {/each}
        {:catch error}
            <p>Error loading products...</p>
        {/await}
    </div>
</section>


<style>
    .group:focus .group-focus\:flex {
        display: flex;
    }
</style>