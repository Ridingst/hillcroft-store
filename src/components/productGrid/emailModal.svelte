<script>

  import { isEmailOpen, hideEmail, price_id, frequency, showError } from './stateStore.js';
  import {setName, setEmail } from './customerStore';

  let emailOpen, price, freq;
  price_id.subscribe((val) => { price = val })
  frequency.subscribe((val) => { freq = val })
  isEmailOpen.subscribe((value)=>{ emailOpen = value });

  let name, email, isValid = true, errorMessage = ""; 

  function updateCustomerData(name, email){
    let promises = [ setName(name), setEmail(email) ]
    return Promise.all(promises)
  }

  async function generateStripeSession() {
    // add loading display for user
    return await fetch("/api/stripe/createCheckout", {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product: price,
        frequency: freq,
        name: name,
        email: email
      })
    })
    .then((data) => {
      if(data.status !== 200) {
        // I think this error should bubble up and get caught by the catch statement...should be tested
        throw new Error('Error creating stripe session. Please try again')
      } else {
        return data.json()
      }
    })
    .catch(error => {
      // surface an error message to the user
      showError(error.message);
    })
    .then((resp)=> {
      window.location.replace(resp.sessionUrl)
    });
  }


  function submitForm(){
    updateCustomerData(name, email)
    .then(()=>{
      isValid = true;
      errorMessage = "";
    })
    .then(() =>{
      generateStripeSession()
    })
    .catch((err) => {
      isValid = false
      errorMessage = err.message
    })
  }


</script>

<div wire:loading class="{emailOpen ? '' : 'hidden'} fixed top-0 left-0 right-0 bottom-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center">

  <div class="fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-gray-700 opacity-50 z-10"></div>
  
  <div class="bg-gray-100 flex opacity-100 flex-col justify-center sm:py-8 rounded-lg z-20">
    <div class="px-10 py-0 xs:p-0 mx-auto md:w-full md:max-w-md">
      <h1 class="text-lg text-center font-bold">HILLCROFT LACROSSE CLUB STORE</h1>
      <img src="/images/hillcroft_lacrosse_club_logo.png" alt="Hillcroft Lacrosse Club Logo" class="object-none object-center w-auto mx-auto py-5"/>
      <div class="bg-white shadow w-full rounded-lg divide-y divide-gray-200">
        
        <div class="px-5 py-7">
          <label class="font-semibold text-sm text-gray-600 pb-1 block" for='name'>Full Name</label>
          <input id="name" bind:value={name} type="text" class="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full" />
          <label class="font-semibold text-sm text-gray-600 pb-1 block" for='email'>Email</label>
          <input id="email" bind:value={email} type="text" class="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full"/>
          <span class:hidden="{isValid}" class="flex items-center font-medium tracking-wide text-red-500 text-xs mt-1 ml-1 m-2">{errorMessage}
          </span>

          <button on:click={submitForm} type="button" class="transition duration-200 bg-blue-500 hover:bg-blue-600 focus:bg-blue-700 focus:shadow-sm focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 text-white w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-semibold text-center inline-block">
            <span class="inline-block mr-2">Payment</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4 inline-block" >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
      <div class="py-5">
        <div class="grid grid-cols-2 gap-1">
          <div class="text-center sm:text-left whitespace-nowrap">
            <button on:click={hideEmail} class="transition duration-200 px-5 py-4 cursor-pointer font-normal text-sm rounded-lg text-gray-500 hover:bg-gray-200 focus:outline-none focus:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 ring-inset">
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
