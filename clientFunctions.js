/*

This file stores function that are to be used on the client side only.
Please put functions for the backend somewhere else, as it might conflict with the client side and cause issues

Copyright 2023 Final Republic contributors
Under GPL v3 license
Most of this code isnt mine anyway, thanks stackoverflow

*/

function toggleElementVisibility(imageIdent) {
    let image = document.getElementById(imageIdent);
    if (image.style.display == 'none') {
        image.style.display = 'block';
    } else {
        image.style.display = 'none';
    }
}