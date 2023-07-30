const username = 'drewvolz'

const activityContainerParentSelectorID = 'section#gh-activity-container'
const activityContainerChildSelectorID = 'div#gh-activity'
const activityContainer = document.querySelector(activityContainerChildSelectorID)

const storage = window.localStorageExtension

const render = (container, data) => {
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
                console.warn(`unimplemented event type: ${type}`)
        }
    })
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

const fetchData = () => {
    fetch(`https://api.github.com/users/${username}/events?per_page=100`)
    .then((response) => {
        if (!(response.status >= 200 && response.status < 299 || response.status === 304)) {
            console.warn(`${response.status} status received, hiding recent github activity section`)
            document.querySelector(activityContainerParentSelectorID).style.display = 'none'
        }

        return response.json()
    })
    .then(filterData)
    .then(cleanData)
    .then(data => {
        render(activityContainer, data)
        storage.setWithExpiry(storage.getKey(), data, storage.getDefaultExpiration())
    })
}

if (activityContainer) {
    /**
     * Cached localstroage queries handle busting when queried by saving an expiry
     * field with the stored data which is one hour later than the last save. If
     * this comes back as null, the ttl has been exceeded so this fetches again.
     */
    const cached = storage.getWithExpiry(storage.getKey())

    if (cached) {
        render(activityContainer, cached)
    } else {
        fetchData()
    }

} else {
    console.warn(`${activityContainerChildSelectorID} could not be found on the page, doing nothing`)
}
