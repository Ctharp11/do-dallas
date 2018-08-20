function autocomplete(input, latInput, lngInput) {
    if(!input) {
        return
    }
    
    var defaultBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(25.841563, -97.39572),
        new google.maps.LatLng(36.493861, -101.043184)
    );

    var options = {
        componentRestrictions: {country: "us"},
        types: ["establishment"],
        bounds:defaultBounds,
        strictBounds: true
    };

    const dropdown = new google.maps.places.Autocomplete(input, options);
    
    dropdown.addListener('place_changed', () => {
        const place = dropdown.getPlace();
        console.log(place);
        if (!place.adr_address.includes('<span class="region">TX</span>')) {
            const error = document.querySelector('.address-error')
            error.innerHTML = 'That\'s not a place in Texas! Try again!'
            latInput.value = '';
            lngInput.value = '';
            return;
        }
        latInput.value = place.geometry.location.lat();
        lngInput.value = place.geometry.location.lng();
    })

    input.on('keydown', (e) => {
        if (e.keyCode === 13) e.preventDefault();
    })
}

export default autocomplete;