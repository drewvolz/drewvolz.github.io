document.addEventListener('DOMContentLoaded', () => {
    const playerContainer = document.getElementById('player-container')
    const genreLinks = document.querySelectorAll('.music-genre-link')

    if (!playerContainer || genreLinks.length === 0) {
        log('Required elements not found.')
        return
    }

    const players = {}
    let activeWidget = null

    /**
     * Creates a new player widget for a given playlist ID.
     * @param {string} playlistId - The SoundCloud playlist ID.
     * @returns {SC.Widget} The SoundCloud widget instance.
     */
    const createWidget = (playlistId) => {
        const iframe = document.createElement('iframe');
        const embeddedPlayerURL = new URL('https://w.soundcloud.com/player/')
        embeddedPlayerURL.searchParams.set('url', `https://api.soundcloud.com/playlists/${playlistId}`)
        embeddedPlayerURL.searchParams.set('color', '#080000')
        embeddedPlayerURL.searchParams.set('auto_play', 'false')
        embeddedPlayerURL.searchParams.set('hide_related', 'false')
        embeddedPlayerURL.searchParams.set('show_comments', 'false')
        embeddedPlayerURL.searchParams.set('show_user', 'true')
        embeddedPlayerURL.searchParams.set('show_reposts', 'false')
        embeddedPlayerURL.searchParams.set('show_teaser', 'false')
        embeddedPlayerURL.searchParams.set('visual', 'false')
        
        iframe.width = '100%'
        iframe.height = '470'
        iframe.scrolling = 'no'
        iframe.frameBorder = 'no'
        iframe.allow = 'autoplay'
        iframe.style.display = 'none'
        playerContainer.appendChild(iframe)
        iframe.src = embeddedPlayerURL.toString()

        const widget = SC.Widget(iframe)
        players[playlistId] = { widget, iframe }
        return widget
    }

    /**
     * Loads a playlist, managing multiple player widgets.
     * @param {HTMLElement} clickedLink - The link element that was clicked.
     */
    const loadPlayer = (clickedLink) => {
        const playlistId = clickedLink.dataset.playlistId
        if (!playlistId) {
            log('No playlist ID provided.')
            return
        }

        const currentActivePlaylistId = Object.keys(players).find(id => players[id].widget === activeWidget)
        if (currentActivePlaylistId === playlistId) {
            log('Playlist already active.')
            return
        }

        genreLinks.forEach(l => l.classList.remove('active-link'))
        clickedLink.classList.add('active-link')

        if (activeWidget) {
            activeWidget.pause()
            players[currentActivePlaylistId].iframe.style.display = 'none'
        }

        if (players[playlistId]) {
            const { widget, iframe } = players[playlistId]
            iframe.style.display = 'block'
            activeWidget = widget
        } else {
            const newWidget = createWidget(playlistId)
            players[playlistId].iframe.style.display = 'block'
            activeWidget = newWidget
        }
    }

    const initialPlaylistId = '2070533073' // curated-classical-link
    activeWidget = createWidget(initialPlaylistId)
    players[initialPlaylistId].iframe.style.display = 'block'

    const initialLink = document.querySelector(`.music-genre-link[data-playlist-id='${initialPlaylistId}']`)
    if (initialLink) {
        initialLink.classList.add('active-link')
    }

    genreLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault()
            loadPlayer(link)
        })
    })
})
