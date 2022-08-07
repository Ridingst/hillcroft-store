import { writable } from 'svelte/store';

export const Name = writable(false);
export const Email = writable(false);
export const Phone = writable(false);

export function setName(value){
    return new Promise((resolve, reject) => {
        if(value == undefined || value == null || value == '' || !value.includes(" ")){
            reject(Error('Please enter your full name'))
        } else {
            let newName = [value.split(" ")[0], value.split(" ").slice(1).join(" ")];
            Name.set(newName)
            resolve(newName)
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


export function setPhone(value){
    return new Promise((resolve, reject) => {
        if(value == undefined || value == null || value == '' || !!!value.match(/^(?:(?:\(?(?:0(?:0|11)\)?[\s-]?\(?|\+)44\)?[\s-]?(?:\(?0\)?[\s-]?)?)|(?:\(?0))(?:(?:\d{5}\)?[\s-]?\d{4,5})|(?:\d{4}\)?[\s-]?(?:\d{5}|\d{3}[\s-]?\d{3}))|(?:\d{3}\)?[\s-]?\d{3}[\s-]?\d{3,4})|(?:\d{2}\)?[\s-]?\d{4}[\s-]?\d{4}))(?:[\s-]?(?:x|ext\.?|\#)\d{3,4})?$/)){
            reject(Error('Please enter a valid mobile number.'))
        } else {
            Email.set(value)
            resolve(value)
        }
    })
    
}