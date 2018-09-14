import '../sass/style.scss';
import ajaxStar from './modules/star';
import autocomplete from './modules/autocomplete';
import makeMap from './modules/map';
import typeAhead from './modules/typeAhead';
import loading from './modules/loading';
import { $, $$ } from './modules/bling';

autocomplete( $('#address'), $('#lat'), $('#lng') )
typeAhead( $('.search') );
makeMap( $('#map') );

const addStore = $( '.get-loader' );
if (addStore) {
   addStore.on('click', loading) 
}



const starForms = $$('form.star')
starForms.on('submit', ajaxStar)