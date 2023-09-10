const jsonFilePath = 'data/projects.json'

const projectsContainerSelectorID = 'section#projects-container'
const projectsSelectorID = `${projectsContainerSelectorID} #projects`

const projectsContainer = document.querySelector(projectsContainerSelectorID)
const projects = document.querySelector(projectsSelectorID)

const hideProjectSection = (reason) => {
    log(`Hiding recent project section: ${reason}`)
    document.querySelector(projectsContainerSelectorID).style.display = 'none'
}

function createHTML(data) {
    data.forEach(item => {
        // Create div element with class "example"
        const divExample = document.createElement('div')
        divExample.classList.add('example')

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
        const detailsContent = document.createElement('div');
        detailsContent.appendChild(ulFeatures)
        
        // Append summary and details content to the details element
        detailsFeatures.appendChild(summaryFeatures)
        detailsFeatures.appendChild(detailsContent)

        divText.appendChild(pDescription)

        if (item.longDescription) {
            divText.appendChild(pLongDescription)
        }

        divText.appendChild(detailsFeatures)

        // Create h1 element for links
        const h1Links = document.createElement('h1')
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

        h1Links.appendChild(spanLinks)

        divExample.appendChild(h1Title)
        divExample.appendChild(divText)
        divExample.appendChild(h1Links)

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
            }

            divImage.appendChild(img)
        }

        projects.appendChild(divExample)
    })
}

const fetchProjectData = (path) => {
    fetch(path)
    .then((response) => response.json())
    .then(data => {
        if (data.length) {
            createHTML(data)
        } else {
            hideProjectSection('no project data to display')
        }
    })
}

if (projectsContainerSelectorID) {
    fetchProjectData(jsonFilePath)
} else {
    log(`${projectsContainerSelectorID} could not be found on the page, doing nothing`)
}
