const username = 'drewvolz'

const activityContainerParentSelectorID = 'section#gh-activity-container'
const activitySectionElement = document.querySelector(activityContainerParentSelectorID)

const activityContainerChildSelectorID = 'div#gh-activity'
const activityContentElement = document.querySelector(activityContainerChildSelectorID)

const storage = window.localStorageExtension

const fetchPrDetails = async (apiUrl) => {
    if (!apiUrl) return null

    const headers = { 'Accept': 'application/vnd.github+json' }

    try {
        const response = await fetch(apiUrl, { headers })
        if (!response.ok) return null
        return await response.json()
    } catch (e) {
        return null
    }
}

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

const filterData = (data) => {
    return data.filter(event => {
        const {payload, actor, type} = event

        const filterType = ['PullRequestEvent']
        const isCorrectType = filterType.includes(type)
        const isCorrectAction = payload && payload.action === 'opened'
        const isCorrectUser = actor && actor.login === username
    
        return isCorrectType && isCorrectAction && isCorrectUser
    })
}

const removeHtml = (html) => {
    const div = document.createElement('div')
    div.textContent = html
    return div.innerText || ''
}

const getRepoName = (event) => (event && event.repo && event.repo.name) ? event.repo.name : 'unknown-repo'

const getPrNumber = (pr, payload) => {
    if (pr && pr.number) return pr.number
    return payload && payload.number ? payload.number : ''
}

const buildHref = (event, payload, pr) => {
    if (pr && pr.html_url) return pr.html_url

    const repo = getRepoName(event)
    const number = getPrNumber(pr, payload)

    if (repo !== 'unknown-repo' && number) {
        return `https://github.com/${repo}/pull/${number}`
    }

    return '#'
}

const getSanitizedTitle = (pr, payload) => {
    const hasNumber = payload && payload.number
    const defaultTitle = hasNumber ? `#${payload.number}` : 'Pull request'
    const rawTitle = pr && pr.title ? pr.title : defaultTitle
    return removeHtml(rawTitle)
}

const buildInnerHtml = ({ title, repoName, href }) => {
    const linkText = escapeHtml(title)
    const titleText = `View pull request titled '${title}' in the ${repoName} repo`
    const link = `<a href="${escapeHtml(href)}" title="${escapeHtml(titleText)}" target="_blank">${linkText}</a>`
    return `<li><i class="fas fa-code-pull-request"></i> ${link}</li>`
}

const buildDisplayData = (event, payload, pr) => {
    const repoName = getRepoName(event)
    const number = getPrNumber(pr, payload)
    const title = getSanitizedTitle(pr, payload)
    const href = buildHref(event, payload, pr)

    return {
        innerHTML: buildInnerHtml({
            title,
            repoName,
            href,
            number
        }),
        prUrl: pr && pr.url
    }
}

const cleanData = (data) => {
    return data.map(event => {
        const {id, type} = event
        const payload = event.payload || {}
        const pr = payload.pull_request || {}
        const displayData = buildDisplayData(event, payload, pr)

        return {
            id,
            type,
            innerHTML: displayData.innerHTML,
            event,
            payload,
            prUrl: displayData.prUrl
        }
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

const enrichData = async (items) => {
    const tasks = items.map(async (item) => {
        if (!item.prUrl) return item
        try {
            const pr = await fetchPrDetails(item.prUrl)
            if (!pr) return item

            const displayData = buildDisplayData(item.event, item.payload, pr)
            return {
                ...item,
                innerHTML: displayData.innerHTML,
                prUrl: displayData.prUrl || item.prUrl,
                pr
            }
        } catch (e) {
            return item
        }
    })

    return Promise.all(tasks)
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
    .then(async (data) => {
        if (data.length) {
            render(activityContentElement, data)
        } else {
            hideActivitySection('no filtered data to display')
        }

        try {
            const enriched = await enrichData(data)
            storage.setWithExpiry(storage.getKey(), enriched, storage.getDefaultExpiration())
            render(activityContentElement, enriched)
        } catch (e) {
            storage.setWithExpiry(storage.getKey(), data, storage.getDefaultExpiration())
        }
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
