const debug = false

const log = (message) => {
    if (debug) {
        console.log(message)
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const musicPlayer = document.getElementById('music-player')
    const genreLinks = document.querySelectorAll('.music-genre-link')

    if (musicPlayer && genreLinks.length > 0) {
        genreLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault()
                const playlistId = link.dataset.playlistId

                if (!playlistId) {
                    log('No playlist ID found.')
                    return
                }

                try {
                    const outerUrl = new URL(musicPlayer.src)
                    const innerUrlParam = outerUrl.searchParams.get('url')
                    
                    if (innerUrlParam) {
                        const innerUrl = new URL(innerUrlParam)
                        innerUrl.pathname = `/playlists/${playlistId}`
                        outerUrl.searchParams.set('url', innerUrl.toString())
                        musicPlayer.src = outerUrl.toString()
                    } else {
                        log('Inner URL parameter not found in iframe src.')
                    }
                } catch (error) {
                    log(`Error parsing URL: ${error.message}`)
                }
            })
        })
    } else {
        log('Music player iframe or genre links not found.')
    }
})
