// page.evaluate has no Playwright timeout: bound the promise in the page itself.
async function waitForMockReady(page, timeout = 30000) {
  await page.evaluate(async (ms) => {
    let timer
    try {
      await Promise.race([
        Promise.resolve(window.__sasjsMockReady).then(() => {
          if (!window.__sasjsMockReady)
            throw new Error('Mock readiness missing')
        }),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Mock readiness timed out')),
            ms
          )
        })
      ])
    } finally {
      clearTimeout(timer)
    }
  }, timeout)
}
module.exports = { waitForMockReady }
