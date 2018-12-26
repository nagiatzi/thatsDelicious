import '../sass/style.scss';
 
import makeMap from './modules/map';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';

/**
 *
 * 
 *  
let addr = document.getElementById('address');
 let lat = document.getElementById('lat');
 let lng = document.getElementById('lng');
 let srch = document.getElementsByClassName('search');
 
 
 autocomplete(addr, lat, lng);
 typeAhead(srch);


 
 */


autocomplete( $('#address'), $('#lat'), $('#lng') );

typeAhead( $('.search') );

makeMap($('#map'));