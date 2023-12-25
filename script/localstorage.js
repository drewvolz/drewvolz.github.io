const ONE_HOUR = 1000 * 60 * 60

window.localStorageExtension = {
    getKey() {
        return 'drewvolz.github.response'
    },

    getDefaultExpiration() {
        return ONE_HOUR
    },

    getWithExpiry(key) {
        const itemStr = localStorage.getItem(key)

        if (!itemStr) {
            return { value: null, expiry: null }
        }

        const item = JSON.parse(itemStr)
        const now = new Date()

        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key)
            return { value: null, expiry: null }
        }

        return { value: item.value, expiry: item.expiry }
    },

    setWithExpiry(key, value, ttl) {
        const now = new Date()

        const item = {
            value: value,
            expiry: now.getTime() + ttl,
        }

        localStorage.setItem(key, JSON.stringify(item))
    },
}
