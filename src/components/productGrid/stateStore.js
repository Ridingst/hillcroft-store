import { writable } from 'svelte/store';

export const isEmailOpen = writable(false);
export const isSuccessOpen = writable(false);

export const isErrorOpen = writable(false);
export const errorMessage = writable("");

export const price_id = writable("")
export const frequency = writable("")


/*
Helper functions for the customer details modal
*/
export function showEmail(price, freq){
    isEmailOpen.set(true);
    price_id.set(price);
    frequency.set(freq);
}

export function hideEmail(){
    isEmailOpen.set(false)
    price_id.set("");
    frequency.set("");
}


/*
Helper functions to display the error screen
*/
export function showError(errMsg="We've had a problem somewhere."){
    hideEmail();
    hideSuccess();
    errorMessage.set(errMsg)
    isErrorOpen.set(true);
}

export function hideError(){
    isErrorOpen.set(false);
    errorMessage.set("");
    window.location.href = '/';
}

/*
Helper functions for the success modal
*/

export function showSuccess(){
    hideEmail();
    isSuccessOpen.set(true);
}

export function hideSuccess(){
    isSuccessOpen.set(false);
    window.location.href = '/';
}