export const script = `<script>
  const inputElement = document.getElementById('fileId')

  document
    .getElementById('uploadButton')
    .addEventListener('click', function () {
      inputElement.click()
    })

  inputElement.addEventListener(
    'change',
    function () {
      const fileList = this.files /* now you can work with the file list */

      updateFileUploadMessage('Requesting ...')

      const file = fileList[0]
      const formData = new FormData()

      formData.append('file', file)
      fetch('/SASjsApi/drive/deploy/upload', {
        method: 'POST',
        body: formData
      })
        .then(async (res) => {
          const { status, ok } = res
          if (status === 200 && ok) {
            const data = await res.json()
            return (
              data.message +
              '\\nstreamServiceName: ' +
              data.streamServiceName +
              '\\nrefreshing page once alert box closes.'
            )
          }
          throw await res.text()
        })
        .then((message) => {
          alert(message)
          location.reload()
        })
        .catch((error) => {
          alert(error)
          resetFileUpload()
          updateFileUploadMessage('Upload New App')
        })
    },
    false
  )

  function updateFileUploadMessage(message) {
    document.getElementById('uploadMessage').innerHTML = message
  }

  function resetFileUpload() {
    inputElement.value = null
  }
</script>`
