import generateGroup from './group';
import style from './popup.css';


function generatePopup(store, ntaCode, boroName) {
    const neighborhood = store.ntaCodeToNeighborhood[ntaCode];

    if (neighborhood.hide) {
        return;
    }

    const neighborhoodGroups = store.ntaCodeToGroups[ntaCode];
    const boroughGroups = store.boroughToLocatedGroup[boroName];
    const { nycGroups, nyGroups, nationalGroups } = store;

    const hasLocalGroups = neighborhoodGroups && neighborhoodGroups.length;

    const html = [];

    if (hasLocalGroups) {
        html.push(`<h2 class="${style.sectionTitle} ${style.sectionTitle} ${style.sectionTitleWithLocalGroups}">Groups in this Neighborhood</h2>`);
        neighborhoodGroups.forEach((group) => html.push(generateGroup(group)));
    }

    if (boroughGroups && boroughGroups.length) {
        html.push(`<h2 class="${style.sectionTitle}">Groups in this Borough</h2>`);
        boroughGroups.forEach((group) => html.push(generateGroup(group)));
    }

    if (nycGroups.length) {
        html.push(`<h2 class="${style.sectionTitle}">Groups in NYC</h2>`);
        nycGroups.forEach((group) => html.push(generateGroup(group)));
    }

    if (nyGroups.length) {
        html.push(`<h2 class="${style.sectionTitle}">Groups in New York State</h2>`);
        nyGroups.forEach((group) => html.push(generateGroup(group)));
    }

    if (nationalGroups.length) {
        html.push(`<h2 class="${style.sectionTitle}">National Groups</h2>`);
        nationalGroups.forEach((group) => html.push(generateGroup(group)));
    }

    return `
        <div class="${style.popup}">
            <h1 class="${style.title}">${neighborhood.name}</h1>
            ${html.join('')}
        </div>
    `.trim();
}

export default generatePopup;
