const jsonFilePath = 'data/projects.json'

const projectsContainerSelectorID = 'section#projects-container'
const projectsWrapperSelector = '.project-tabs-wrapper'
const projectsNavSelector = '.project-tabs-nav'
const projectsContentSelector = '.project-tabs-content'
const projectsStackedSelector = '.project-stacked-wrapper' // New selector for stacked projects

const projectsContainer = document.querySelector(projectsContainerSelectorID)
const projectsNav = document.querySelector(projectsNavSelector)
const projectsContent = document.querySelector(projectsContentSelector)
const projectsStacked = document.querySelector(projectsStackedSelector) // Reference to new stacked container

const hideProjectSection = (reason) => {
    console.log(`Hiding recent project section: ${reason}`)
    if (projectsContainer) {
        projectsContainer.style.display = 'none'
    }
}

function createProjectHTML(item) {
    // Create div element with class "example" and unique ID
    const divExample = document.createElement('div')
    divExample.classList.add('example')
    divExample.dataset.projectId = item.id // Use a unique ID for tab content matching

    // Create h1 element for the title
    const h1Title = document.createElement('h1')
    h1Title.textContent = item.title

    // Create div element with class "text left"
    const divText = document.createElement('div')
    divText.classList.add('text', 'left')

    // Create p element for the description
    const pDescription = document.createElement('p')
    pDescription.classList.add('description')
    pDescription.textContent = item.description

    // Create p element for the long description
    const pLongDescription = document.createElement('p')
    pLongDescription.classList.add('longDescription')
    pLongDescription.textContent = item.longDescription

    // Create the details/summary elements
    const detailsFeatures = document.createElement('details')
    if (window.innerWidth >= 1024) {
        detailsFeatures.setAttribute('open', '')
    }
    const summaryFeatures = document.createElement('summary')
    summaryFeatures.textContent = item.detailSummary

    // Create ul element for the list of features
    const ulFeatures = document.createElement('ul')

    // Populate feature list items
    item.detailList.forEach(detail => {
        const liFeature = document.createElement('li')
        liFeature.textContent = detail
        ulFeatures.appendChild(liFeature)
    })

    // Create details content element
    const detailsContentDiv = document.createElement('div')
    detailsContentDiv.appendChild(ulFeatures)
    
    // Append summary and details content to the details element
    detailsFeatures.appendChild(summaryFeatures)
    detailsFeatures.appendChild(detailsContentDiv)

    divText.appendChild(pDescription)

    if (item.longDescription) {
        divText.appendChild(pLongDescription)
    }

    divText.appendChild(detailsFeatures)

    // Create div element for social links
    const divSocialLinks = document.createElement('div')
    divSocialLinks.classList.add('social-links-container')
    const spanLinks = document.createElement('span')
    spanLinks.classList.add('links')

    // Create links
    const projectLinks = Object.entries(item.links)
    projectLinks.forEach(link => {
        const infoIcon = document.createElement('i')
        const projectLink = document.createElement('a')
        projectLink.href = link[1]

        switch(link[0]) {
            case 'github':
                projectLink.title = 'View the code on GitHub'
                infoIcon.classList.add('fab', 'fa-github')
                break
            case 'appstore':
                projectLink.title = 'View on iOS App Store'
                infoIcon.classList.add('fab', 'fa-app-store-ios')
                break
            case 'playstore':
                projectLink.title = 'View on Google Play Store'
                infoIcon.classList.add('fab', 'fa-google-play')
                break
        }

        projectLink.appendChild(infoIcon)
        spanLinks.appendChild(projectLink)
    })

    divSocialLinks.appendChild(spanLinks)

    divExample.appendChild(h1Title)
    divExample.appendChild(divText)

    // Create div element for the project image
    const divImage = document.createElement('div')
    const img = document.createElement('img')
    if (item.image) {
        img.src = item.image

        const metaText = `Screenshot of ${item.title}`
        img.title = metaText
        img.alt = metaText

        switch(item.imageLayout) {
            case 'right':
                divImage.classList.add('image', 'right')
                divExample.appendChild(divImage)
                break
            case 'bottom':
                divText.appendChild(divImage)
                break
            case 'left':
                divImage.classList.add('image', 'left')
                divExample.insertBefore(divImage, h1Title.nextSibling) // Insert after h1
                break
        }

        divImage.appendChild(img)
    }

    divExample.appendChild(divSocialLinks)

    return divExample
}

function initializeTabbedProjects(data) {
    if (!projectsNav || !projectsContent) return

    projectsNav.innerHTML = '' // Clear existing tabs
    projectsContent.innerHTML = '' // Clear existing content

    data.forEach((item, index) => {
        // Create tab button
        const tabButton = document.createElement('button')
        tabButton.classList.add('project-tab-button')
        tabButton.textContent = item.title
        tabButton.dataset.projectId = item.id // Store project ID
        projectsNav.appendChild(tabButton)

        // Create tab content
        const tabContent = createProjectHTML(item)
        tabContent.classList.add('project-tab-content')
        tabContent.style.display = 'none' // Hide by default, CSS will handle desktop display
        tabContent.dataset.projectId = item.id // Store project ID for content
        projectsContent.appendChild(tabContent)

        // Set first tab as active initially
        if (index === 0) {
            tabButton.classList.add('active')
            tabContent.style.display = 'grid' // Show first content, will be overridden by CSS on non-desktop
        }

        tabButton.addEventListener('click', () => {
            // Remove active class from all buttons and hide all content
            projectsNav.querySelectorAll('.project-tab-button').forEach(btn => btn.classList.remove('active'))
            projectsContent.querySelectorAll('.project-tab-content').forEach(content => content.style.display = 'none')

            // Add active class to clicked button and show its content
            tabButton.classList.add('active')
            tabContent.style.display = 'grid'
        })
    })
}

function initializeStackedProjects(data) {
    if (!projectsStacked) return

    projectsStacked.innerHTML = '' // Clear existing stacked projects

    data.forEach(item => {
        const projectElement = createProjectHTML(item)
        projectsStacked.appendChild(projectElement)
    })
}

const fetchProjectData = (path) => {
    fetch(path)
    .then((response) => response.json())
    .then(data => {
        // Assign a unique ID to each project based on its index
        const projectsWithIds = data.map((item, index) => ({ ...item, id: `project-${index}` }))

        if (projectsWithIds.length) {
            initializeTabbedProjects(projectsWithIds)
            initializeStackedProjects(projectsWithIds)
        } else {
            hideProjectSection('no project data to display')
        }
    })
    .catch(error => {
        console.error('Error fetching project data:', error)
        hideProjectSection('error fetching data')
    })
}

if (projectsContainer) {
    fetchProjectData(jsonFilePath)
} else {
    console.log(`${projectsContainerSelectorID} could not be found on the page, doing nothing`)
}