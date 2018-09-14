function loading() {
    console.log('submitted')
    if(window.onload) {
        console.log('page loaded')
        document.querySelector('.loading').innerHTML = '';
    }
    else if (!window.onload) {
        console.log('page loading')
        document.querySelector('.loading').innerHTML = 'Loading...';
    }
}

export default loading;