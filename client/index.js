import Store from './store';
import NeighborhoodMap from './components/map';
import generatePopupHtml from './components/popup';

import 'mapbox-gl/dist/mapbox-gl.css';
import './style.scss';


document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(document.location.search.substring(1));
    let fillOpacity = Number(params.get('opacity') || 1);
    if (isNaN(fillOpacity)) {
        fillOpacity = 1;
    }

    const store = new Store();
    const map = new NeighborhoodMap({ mapId: '#map', fillOpacity });

    await Promise.all([map.load(), store.fetchData()]);
    map.configure(store, generatePopupHtml);
});
