import style from './group.css';


function generateGroupHtml(group) {
    const {
        name,
        missionShort: description,
        website,
        groupPhone: phone,
        groupEmail: email,
    } = group;

    let nameHtml = name;
    if (website) {
        let websiteHref = group.website;
        if (website.indexOf('http') < 0) {
            websiteHref = `http://${website}`;
        }
        nameHtml = `
            <a class="${style.website}" href="${websiteHref}" target="_blank">
                ${name}
            </a>
        `;
    }

    let phoneHref = phone.replace(/[()-\s.]/g, '');
    if (phone.indexOf('+') !== 0) {
        if (phone.indexOf('1') === 0) {
            phoneHref = `+${phoneHref}`;
        } else {
            phoneHref = `+1${phoneHref}`;
        }
    }

    const descriptionHtml = description ? `<span class="${style.description}">${description}</span>` : '';
    const emailHtml = email ? `<span class="${style.email}">${email}</span>` : '';
    const phoneHtml = phone ? `<a href="tel:${phoneHref}" class="${style.phone}">${phone}</a>` : '';

    return `
        <div class="${style.group}">
            <h3 class="${style.name}">${nameHtml}</h3>
            ${descriptionHtml}
            ${emailHtml}
            ${phoneHtml}
        </div>
    `;
    // ${group.twitter
    //     ? `<span class="${style.twitter}"><a href="https://twitter.com/${group.twitter.replace(/^@/, '')}">${group.twitter}</a></span>`
    //     : '' }
    // ${group.instagram
    //     ? `<span class="${style.instagram}"><a href="https://instagram.com/${group.instagram.replace(/^@/, '')}">${group.instagram}</span>`
    //     : '' }
}

export default generateGroupHtml;
