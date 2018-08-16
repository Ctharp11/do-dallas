import '../sass/style.scss';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import { $, $$ } from './modules/bling';

autocomplete( $('#address'), $('#lat'), $('#lng') )
typeAhead('test');