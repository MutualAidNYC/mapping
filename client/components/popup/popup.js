import generateGroup from './group';
import style from './popup.css';


function generatePopupHtml({
    neighborhoodName,
    localGroups,
    boroGroups,
    groupsInNyc,
    groupsInNys,
    nationalGroups
}) {
    const html = [];

    if (localGroups && localGroups.length) {
        html.push(`<h2 class="${style.sectionTitle} ${style.sectionTitle} ${style.sectionTitleWithLocalGroups}">Groups in this Neighborhood</h2>`);
        localGroups.forEach((group) => html.push(generateGroup(group)));
    }

    if (boroGroups && boroGroups.length) {
        html.push(`<h2 class="${style.sectionTitle}">Groups in this Borough</h2>`);
        boroGroups.forEach((group) => html.push(generateGroup(group)));
    }

    if (groupsInNyc.length) {
        html.push(`<h2 class="${style.sectionTitle}">Groups in NYC</h2>`);
        groupsInNyc.forEach((group) => html.push(generateGroup(group)));
    }

    if (groupsInNys.length) {
        html.push(`<h2 class="${style.sectionTitle}">Groups in New York State</h2>`);
        groupsInNys.forEach((group) => html.push(generateGroup(group)));
    }

    if (nationalGroups.length) {
        html.push(`<h2 class="${style.sectionTitle}">National Groups</h2>`);
        nationalGroups.forEach((group) => html.push(generateGroup(group)));
    }

    return `
        <div class="${style.popup}">
            <h1 class="${style.title}">${neighborhoodName}</h1>
            ${html.join('')}
        </div>
    `.trim();
}

export default generatePopupHtml;
