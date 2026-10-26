/**
 * Runs before each unit spec (jest setupFiles).
 *
 * The unit suite mounts the express app directly and never opens a socket, but
 * `verifyEnvVariables` refuses an environment that enables no listener, so the
 * suite declares the one it assumes: a single plain HTTP port. Specs that test the
 * listener rules build their own environment object and call `resolveListeners`
 * directly, so this default never hides a rule they assert.
 */
if (!process.env.HTTP_PORT && !process.env.HTTPS_PORT)
  process.env.HTTP_PORT = '5000'
