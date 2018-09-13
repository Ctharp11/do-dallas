function autocomplete(input, latInput, lngInput) {
    if(!input) {
        return
    }

    const recommendBtn = document.getElementsByClassName('store-recommend-button');
    for(var i = 0; i < recommendBtn.length; i++) {
        recommendBtn[i].on('click', function() {
            const attr = this.getAttribute('data-text');
            const recommend = document.querySelector('.store-recommend-value');
            const vote = document.querySelector('.store-recommend-real');
            recommend.value = this.value;
            vote.value = Number(attr);
            recommend.setAttribute('data-text', attr);
        })
    };

    
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
        const patt = new RegExp('<span class="locality">(.*?)<\/span>');
        const placeFull = place.adr_address;
        const result = patt.exec(placeFull);
        const city = document.querySelector('.city');
        const name = document.querySelector('.name');
        const text = document.querySelector('.text');
        const error = document.querySelector('.address-error');
        const hidden = document.querySelector('.store-temp-hide');
        const address = document.querySelector('#address');
        error.innerHTML = '';
        city.value = '';
        if (!place.adr_address.includes('<span class="region">TX</span>')) {
            error.innerHTML = 'That\'s not a place in Texas! Try again!';
            latInput.value = '';
            lngInput.value = '';
            return;
        }
        city.value = result[1];
        name.value = place.name;
        latInput.value = place.geometry.location.lat();
        lngInput.value = place.geometry.location.lng();
        if (city.value && name.value !== '') {
            hidden.classList.remove('store-temp-hide');
        }
    })

    // address.on('keydown', function() {
    //     console.log(this.innerHTML);
    //     const hidden = document.querySelector('.form-flex');
    //     if (this.innerHTML === '') {
    //         hidden.classList.add('store-temp-hide');
    //     }
    // })

    input.on('keydown', (e) => {
        if (e.keyCode === 13) e.preventDefault();
    })
}

export default autocomplete;