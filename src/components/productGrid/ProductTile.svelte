<script>
    export let id;
    export let name;
    export let metadata;
    export let description;
    export let image = '';
    export let price_id;
    export let price_metadata = {};
    export let price_nickname;
    export let frequency;
    export let price;

</script>

<div>
    <a href="/" class="block h-64 rounded-lg shadow-lg bg-white overflow-hidden">
        <img class="mx-auto w-full object-cover" src={image} alt={name + " - " + description}>
    </a>
    <div class="flex items-center justify-between mt-3">
        <div>
            <a href="/" class="font-medium">{name}</a>
            <a class="flex items-center" href="/">
                <span class="text-xs font-medium text-gray-600">by</span>
                <span class="text-xs font-medium ml-1 text-indigo-500">{description + " " + frequency}</span>
            </a>
        </div>
        <span class="flex items-center h-8 bg-indigo-200 text-indigo-600 text-sm px-2 rounded">£{price/100}{#if frequency === "month"}/month{/if}</span>
    </div>
</div>