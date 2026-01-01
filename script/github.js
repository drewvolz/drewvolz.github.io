const username = 'drewvolz'

const activityContainerParentSelectorID = 'section#gh-activity-container'
const activitySectionElement = document.querySelector(activityContainerParentSelectorID)

const activityContainerChildSelectorID = 'div#gh-activity'
const activityContentElement = document.querySelector(activityContainerChildSelectorID)

const escapeHtml = (str) => {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

const render = (container, data) => {
    if (data.length === 0) {
        hideActivitySection('no data to display')
        return
    }

    container.innerHTML = ''

    const ulElement = document.createElement('ul')

    data.forEach(item => {
        const {id, type, innerHTML} = item

        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = innerHTML

        const liElement = tempDiv.firstChild

        if (liElement && liElement.tagName === 'LI') {
            liElement.setAttribute('data-id', id)
            liElement.setAttribute('data-type', type)
            ulElement.appendChild(liElement)
        } else {
            log(`Error: innerHTML did not produce an LI element for item type: ${type}`)
        }
    })

    container.appendChild(ulElement)
    showActivitySection()
}

const hideActivitySection = (reason) => {
    log(`Hiding recent github activity section: ${reason}`)
    if (activitySectionElement) {
        activitySectionElement.classList.remove('visible')
    }
}

const showActivitySection = () => {
    if (activitySectionElement) {
        activitySectionElement.classList.add('visible')
    }
}

// Main execution block
if (activitySectionElement) {
    fetch('data/github_activity.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.length) {
            render(activityContentElement, data)
        } else {
            hideActivitySection('no data to display')
        }
    })
    .catch(error => {
        hideActivitySection(`error fetching local github activity data: ${error.message}`)
    })
} else {
    log(`${activityContainerParentSelectorID} could not be found on the page, doing nothing`)
}
