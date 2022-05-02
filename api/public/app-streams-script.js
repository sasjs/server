const inputElement = document.getElementById('fileId')

document.getElementById('uploadButton').addEventListener('click', function () {
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

    axios
      .post('/SASjsApi/drive/deploy/upload', formData)
      .then((res) => res.data)
      .then((data) => {
        return (
          data.message +
          '\nstreamServiceName: ' +
          data.streamServiceName +
          '\nrefreshing page once alert box closes.'
        )
      })
      .then((message) => {
        alert(message)
        location.reload()
      })
      .catch((error) => {
        alert(error.response.data)
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
