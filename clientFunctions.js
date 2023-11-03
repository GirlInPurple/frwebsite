function toggleElementVisibility(imageIdent) {
    var image = document.getElementById(imageIdent);
    if (image.style.display === 'none') {
        image.style.display = 'block';
    } else {
        image.style.display = 'none';
    }
}