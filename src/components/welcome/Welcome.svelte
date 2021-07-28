<script>
	import { onMount } from "svelte";
	import { apiData, person } from './welcome.js';

	onMount(async () => {
		fetch("/api")
		.then(response => response.json())
		.then(data => {
			console.log(data);
			apiData.set(data);
		}).catch(error => {
			console.log(error);
			return [];
		});
	});
</script>

<h1>Welcome {$person.name}</h1>

<style>
	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}
</style>