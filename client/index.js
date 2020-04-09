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

    // Get the host from the webpack config;
    // webpack interpolates the `BASEURL` value here.
    const baseUrl = BASEURL; // eslint-disable-line

    const store = new Store(baseUrl);
    const map = new NeighborhoodMap({ mapId: '#map', fillOpacity });

    await Promise.all([map.load(baseUrl), store.fetchData()]);
    map.configure(store, generatePopupHtml);
});
