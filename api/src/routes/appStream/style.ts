export const style = `<style>
* {
  font-family: 'Roboto', sans-serif;
}
.app-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  padding-top: 50px;
}
.app-container .app {
  width: 150px;
  height: 180px;
  margin: 10px;
  overflow: hidden;
  text-align: center;

  text-decoration: none;
  color: black;

  background: #efefef;
  padding: 10px;
  border-radius: 7px;
  border: 1px solid #d7d7d7;
}
.app-container .app img{
  width: 100%;
  margin-bottom: 10px;
  border-radius: 10px;
}
#uploadButton {
  border: 0
}

#uploadButton:focus {
  outline: 0
}

#uploadMessage {
  position: relative;
  bottom: -5px;
}

header {
  transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  box-shadow: rgb(0 0 0 / 20%) 0px 2px 4px -1px, rgb(0 0 0 / 14%) 0px 4px 5px 0px, rgb(0 0 0 / 12%) 0px 1px 10px 0px;
  display: flex;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
  position: fixed;
  top: 0px;
  left: auto;
  right: 0px;
  background-color: rgb(0, 0, 0);
  color: rgb(255, 255, 255);
  z-index: 1201;
}

header h1 {
  margin: 13px;
  font-size: 20px;
}

header a {
  align-self: center;
}

header .logo {
  width: 35px;
  margin-left: 10px;
  align-self: center;
}
</style>`
