<script>
    import { isErrorOpen, hideError, showError, errorMessage } from './stateStore.js';

    let errorOpen, errMsg;
    isErrorOpen.subscribe((val) => { errorOpen = val });
    errorMessage.subscribe((val) => { errMsg = val });

    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('error')){
      (urlParams.has("errorMsg")) ? showError(urlParams.get("errorMsg")) : showError();
    };
</script>


<div wire:loading class="{errorOpen ? '' : 'hidden'} fixed top-0 left-0 right-0 bottom-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center">

    <div class="fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-gray-700 opacity-50 z-10"></div>
    
    <div class="bg-gray-100 flex opacity-100 flex-col justify-center sm:py-8 rounded-lg z-20">
      <div class="px-10 py-0 xs:p-0 mx-auto md:w-full md:max-w-md">
        <h1 class="text-lg text-center font-bold">HILLCROFT LACROSSE CLUB STORE</h1>
        <img src="/images/hillcroft_lacrosse_club_logo.png" alt="Hillcroft Lacrosse Club Logo" class="object-none object-center w-auto mx-auto py-5"/>
        <div class="bg-white shadow w-full rounded-lg divide-y divide-gray-200">
          <div class="px-5 py-7">
            <h3 class="text-center text-2xl text-red-800">Oops, this is emabarassing</h3>
            <p class="text-center text-lg text-gray-light">{errMsg}</p>
            <hr class="m-5"/>
            <p class="text-center">Please retry and if the problem persists contact us at info@hillcroftlacrosse.com</p>
          </div>
        </div>
        <div class="py-5">
          <div class="grid grid-cols-2 gap-1">
            <div class="text-center sm:text-left whitespace-nowrap">
              <button on:click={hideError} class="transition duration-200 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-gray-500 hover:bg-gray-200 focus:outline-none focus:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  class="w-4 h-4 inline-block align-text-top"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span class="inline-block ml-1">Back to store</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>