import { writable } from 'svelte/store';

/** Store for your data. 
This assumes the data you're pulling back will be an array.
If it's going to be an object, default this to an empty object.
**/

export const products = writable([]);

/** Data transformation.
For our use case, we only care about the name, not the other information.
Here, we'll create a derived store to hold the name.

export const products = derived(apiData, ($apiData) => {
	return products.products
});

**/