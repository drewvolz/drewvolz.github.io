const username = 'drewvolz'

const activityContainerParentSelectorID = 'section#gh-activity-container'
const activitySectionElement = document.querySelector(activityContainerParentSelectorID)

const activityContainerChildSelectorID = 'div#gh-activity'
const activityContentElement = document.querySelector(activityContainerChildSelectorID)

const storage = window.localStorageExtension

const render = (container, data) => {
    if (data.length === 0) {
        hideActivitySection('no data to display')
        return
    }

    container.innerHTML = ''

    data.forEach(item => {
        const {id, type, innerHTML} = item

        const eventContainer = document.createElement('div')
        eventContainer.setAttribute('data-id', id)
        eventContainer.setAttribute('data-type', type)

        switch(type) {
            case 'PullRequestEvent':
                eventContainer.innerHTML = innerHTML
                container.appendChild(eventContainer)
                break
            default:
                log(`unimplemented event type: ${type}`)
        }
    })

    showActivitySection()
}

const filterData = (data) => {
    return data.filter(event => {
        const {payload, actor, type} = event

        const filterType = ['PullRequestEvent']
        const isCorrectType = filterType.includes(type)
        const isCorrectAction = payload.action === 'opened'
        const isCorrectUser = actor.login === username
    
        return isCorrectType && isCorrectAction && isCorrectUser
    })
}

const cleanData = (data) => {
    return data.map(event => {
        const {id, type, payload} = event
        const pr = payload.pull_request

        const dateCreated = new Date(pr.created_at).toDateString()
        const titleText = `"View pull request titled '${pr.title}' in the ${pr.base.repo.name} repo, created ${dateCreated}"`
        const link = `<a href="${pr.html_url}" title=${titleText} target="_blank">#${pr.number}</a>`
        const innerHTML = `<li>${pr.title} (${link})</li>`

        return {id, type, innerHTML}
    })
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

const fetchData = () => {
    fetch(`https://api.github.com/users/${username}/events?per_page=100`)
    .then((response) => {
        if (!(response.status >= 200 && response.status < 299)) {
            throw new Error(`${response.status} status received`)
        }

        return response.json()
    })
    .then(filterData)
    .then(cleanData)
    .then(data => {
        if (data.length) {
            render(activityContentElement, data)
        } else {
            hideActivitySection('no filtered data to display')
        }
        storage.setWithExpiry(storage.getKey(), data, storage.getDefaultExpiration())
    })
    .catch(error => {
        hideActivitySection(`error fetching data: ${error.message}`)
    })
}

if (activitySectionElement) {
    /**
     * Cached localstorage queries handle busting when queried by saving an expiry
     * field with the stored data which is one hour later than the last save. If
     * this comes back as null, the ttl has been exceeded so this fetches again.
     */
    const cached = storage.getWithExpiry(storage.getKey())

    if (cached.value) {
        render(activityContentElement, cached.value)
    } else {
        fetchData()
    }

} else {
    log(`${activityContainerParentSelectorID} could not be found on the page, doing nothing`)
}
