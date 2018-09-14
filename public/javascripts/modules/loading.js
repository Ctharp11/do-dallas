function loading() {
    if(window.onload) {
        document.querySelector('.loading').innerHTML = '';
    }
    else if (!window.onload) {
        document.querySelector('.loading').innerHTML = 'Loading...';
    }
}

export default loading;