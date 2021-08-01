import { writable } from 'svelte/store';

export const isEmailOpen = writable(false);
export const isSuccessOpen = writable(false);
export const isErrorOpen = writable(false);

export function showEmail(){
    isEmailOpen.set(true)
}

export function hideEmail(){
    isEmailOpen.set(false)
}