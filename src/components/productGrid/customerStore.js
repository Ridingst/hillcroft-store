import { writable } from 'svelte/store';

export const Name = writable(false);
export const Email = writable(false);

export function setName(value){
    return new Promise((resolve, reject) => {
        if(value == undefined || value == null || value == '' || !value.includes(" ")){
            reject(Error('Please enter your full name'))
        } else {
            Name.set(value)
            resolve(value)
        }
    })
}

export function setEmail(value){
    return new Promise((resolve, reject) => {
        if(value == undefined || value == null || value == '' || !!!value.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)){
            reject(Error('Please enter a valid email address.'))
        } else {
            Email.set(value)
            resolve(value)
        }
    })
    
}