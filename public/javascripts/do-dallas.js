import '../sass/style.scss';
import ajaxStar from './modules/star';
import autocomplete from './modules/autocomplete';
import makeMap from './modules/map';
import typeAhead from './modules/typeAhead';
import { $, $$ } from './modules/bling';

autocomplete( $('#address'), $('#lat'), $('#lng') )
typeAhead( $('.search') );
makeMap( $('#map') );

const starForms = $$('form.star')
starForms.on('submit', ajaxStar)