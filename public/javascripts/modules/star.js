import axios from 'axios';
import { $ } from './bling';

function ajaxStar(e) {
    e.preventDefault();

    axios.post(`${this.action}`)
    .then(res => {
        const isStarred = this.stars.classList.toggle('star__button--starred');
        $('.star-count').textContent = res.data.stars.length;
        if(isStarred) {
            this.stars.classList.add('star__button--float');
            setTimeout(() => {
                this.stars.classList.remove('star__button--float');
            }, 2500);
        }
    }).catch(err => console.log(err))
}

export default ajaxStar;