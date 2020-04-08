import generateGroupHtml from './group';
import style from './popup.css';


const NONLOCAL_GEOSCOPES = {
    NEW_YORK_CITY: 'New York City',
    NEW_YORK_STATE: 'New York State',
    NATIONAL: 'National',
    GLOBAL: 'Global',
};

function generatePopupHtml({
    neighborhoodName,
    localGroups,
    boroGroups,
    nonlocalGroups,
}) {
    const {
        NEW_YORK_CITY,
        NEW_YORK_STATE,
        NATIONAL,
        GLOBAL,
    } = NONLOCAL_GEOSCOPES;

    const sections = [];
    const addSectionTitle = (title, isLocalGroups) => {
        sections.push(`<h2 class="${style.sectionTitle} ${isLocalGroups ? style.sectionTitleWithLocalGroups : ''}">${title}</h2>`);
    }
    const displayedGroupIds = new Set();
    const notAlreadyDisplayed = (group) => !displayedGroupIds.has(group.airtableId);
    const byName = (groupA, groupB) => groupA.name.localeCompare(groupB.name);
    const display = (group) => {
        sections.push(generateGroupHtml(group));
        displayedGroupIds.add(group.airtableId);
    }

    const addSection = (groups, title, isLocalGroups = false) => {
        const filteredGroups = groups.filter(notAlreadyDisplayed).sort(byName);
        if (filteredGroups.length) {
            addSectionTitle(title, isLocalGroups);
            filteredGroups.forEach(display);
        }
    }

    addSection(localGroups, 'Groups in this Neighborhood', true);
    addSection(boroGroups, 'Groups in this Borough');
    addSection(nonlocalGroups[NEW_YORK_CITY], 'Groups in NYC');
    addSection(nonlocalGroups[NEW_YORK_STATE], 'Groups in New York State');
    addSection(nonlocalGroups[NATIONAL], 'National Groups');
    addSection(nonlocalGroups[GLOBAL], 'Global Groups');

    return `
        <div class="${style.popup}">
            <h1 class="${style.title}">${neighborhoodName}</h1>
            ${sections.join('')}
        </div>
    `.trim();
}

export default generatePopupHtml;
