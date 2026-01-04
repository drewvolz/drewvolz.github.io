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
        const currentSrc = musicPlayer.src
        const urlParamIndex = currentSrc.indexOf('playlists/')
        const baseSrc = currentSrc.substring(0, urlParamIndex + 'playlists/'.length)

        const suffixStartIndex = currentSrc.indexOf('&color=')
        const suffix = currentSrc.substring(suffixStartIndex)

        genreLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault() // Prevent the default link behavior
                const playlistId = link.dataset.playlistId
                
                if (playlistId) {
                    const newSrc = baseSrc + playlistId + suffix
                    musicPlayer.src = newSrc
                    log(`Changed playlist to ID: ${playlistId}`)
                }
            })
        })
    } else {
        log('Music player iframe or genre links not found.')
    }
})
