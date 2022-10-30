const globalCss = `
html > body {
  background: url(/resource/cvijece/themes/bluebackground.jpg) repeat-y fixed center -10px #6a75b4;
}

.App > header > nav,
.App > footer,
#hw-sitemap > form,
#hw-content > header,
#hw-content > footer,
#hw-powered-by,
#hw-hamburger {
  display: none;
}

/* sidebar */
#hw-sitemap {
  display: block !important;
  box-sizing: content-box;
  position: absolute;
  width: 1012px;
  top: 0;
  left: 50%;
  margin-left: -512px;
  margin-top: 0;
  height: 36px;
  background-color: transparent;
  border: 0;
  padding: 8px 6px;
  box-shadow: none;
  overflow: visible;
  background: transparent url(/resource/cvijece/themes/sitemap.jpg) repeat-x scroll 0 0;
}

#hw-sitemap li {
  float: right;
  border: 0;
  padding: 0;
  margin: 0 5px;
}

#hw-sitemap li a {
  display: block;
  font-size: 22px;
  text-decoration: none !important;
  color: white;
  border: 0;
  padding: 0 5px;
  margin: 0;
  transition: all 0.3s ease-out;
}
#hw-sitemap li a:hover,
#hw-sitemap li a.hw-selected {
  box-shadow: 0 0 5px #eee;
  border-radius: 5px;
}

#hw-sitemap #hw-sitemap-logo {
  background: none;
  position: absolute;
  top: 15px;
  left: 40px;
  width: 235px;
  height: 75px;
}

#hw-sitemap-logo .MuiAvatar-root {
  width: auto;
  height: auto;
  border-radius: 0;
}

/* album */
#hw-content .hw-item {
  display: block;
  position: absolute;
  width: 1050px;
  height: 555px;
  margin-top: 105px;
  left: 50%;
  transform: translateX(-25%);
  text-align: center;
}

.hw-item > ul {
  margin: 0 80px 80px 80px;
  position: absolute;
  left: -16%;
  width: 80%;
}
.hw-item > ul > li {
  border-radius: 5px;
  border: 5px solid white;
  margin: 5px;
  padding: 0;
  background-color: white;
  background-color: rgba(255, 255, 255, 0.4);
}
.hw-item > ul > li .hw-album-title {
  display: none;
}

/* content */
.hw-item > header,
.hw-item > footer {
  display: none;
}

#hw-content article > nav > .hw-first,
#hw-content article > nav > .hw-top,
#hw-content article > nav > .hw-last {
  display: none;
}

#hw-content article > nav {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
}
#hw-content article > nav > a {
  float: none !important;
  text-shadow: 0 0;
  position: absolute;
  top: 300px;
  left: 10vw;
  color: transparent;
  border: 0;
  width: 82px;
  height: 50px;
  box-shadow: none;
  background: transparent url(/resource/cvijece/themes/nav.png) repeat-x scroll -80px -120px;
  transition: all 0.3s ease-out;
  z-index: 1;
}
#hw-content article > nav > .hw-prev {
  top: 300px;
  left: auto;
  right: 10vw;
  background: transparent url(/resource/cvijece/themes/nav.png) repeat-x scroll -82px -167px;
}
#hw-content article > nav > a:hover {
  box-shadow: 0 0 5px #6a75b4;
  border-radius: 5px;
}
#hw-content article > nav > a:not([href]) {
  display: none;
}

.hw-item figure {
  display: block;
  position: absolute;
  top: 0;
  left: 50%;
  margin-left: -270px;
  border-radius: 10px;
  outline: 10px solid white;
  padding: 0;
  background-color: white;
  background-color: rgba(255, 255, 255, 0.4);
  min-width: 500px;
  min-height: 395px;
  text-align: center;
}
.hw-item figure img {
  max-width: 500px;
  max-height: 375px;
}
`;

export default globalCss;
