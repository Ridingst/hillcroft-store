<script>
    export let id;
    export let name;
    export let metadata;
    export let description = " ";
    export let image = '/images/lacrosse-helmet.png';
    export let price_id;
    export let price_metadata = {};
    export let price_nickname;
    export let frequency;
    export let price;

</script>

<sectin>
    
    <div class="container items-center px-5 py-5 lg:px-10">
        <div class="flex flex-wrap w-full">
          <div class="w-full mx-auto my-4 bg-white border rounded-lg shadow-xl lg:w-full">
            <div class="p-6 text-center">
              <img alt="{name}" class="flex-shrink-0 object-cover object-center w-16 h-16 mx-auto -mt-12 rounded-full shadow-xl aboslute border-black border-2" src="{image}">
              <h2 class="pt-4 mb-8 text-xs font-semibold tracking-widest text-black uppercase title-font"> HILLCROFT</h2>
              <h4 class="mb-8 text-2xl font-semibold leading-none tracking-tighter text-black lg:text-3xl title-font "> {name}</h4>
              <p class="mb-3 text-base leading-relaxed text-blueGray-500"> {description} </p>
              <button class="bg-yellow text-white border-black font-bold py-2 px-4 rounded inline-flex items-center">
                <svg class="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M14.781,14.347h1.738c0.24,0,0.436-0.194,0.436-0.435v-1.739c0-0.239-0.195-0.435-0.436-0.435h-1.738c-0.239,0-0.435,0.195-0.435,0.435v1.739C14.347,14.152,14.542,14.347,14.781,14.347 M18.693,3.045H1.307c-0.48,0-0.869,0.39-0.869,0.869v12.17c0,0.479,0.389,0.869,0.869,0.869h17.387c0.479,0,0.869-0.39,0.869-0.869V3.915C19.562,3.435,19.173,3.045,18.693,3.045 M18.693,16.085H1.307V9.13h17.387V16.085z M18.693,5.653H1.307V3.915h17.387V5.653zM3.48,12.608h7.824c0.24,0,0.435-0.195,0.435-0.436c0-0.239-0.194-0.435-0.435-0.435H3.48c-0.24,0-0.435,0.195-0.435,0.435C3.045,12.413,3.24,12.608,3.48,12.608 M3.48,14.347h6.085c0.24,0,0.435-0.194,0.435-0.435s-0.195-0.435-0.435-0.435H3.48c-0.24,0-0.435,0.194-0.435,0.435S3.24,14.347,3.48,14.347"/></svg>
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    
</sectin>
