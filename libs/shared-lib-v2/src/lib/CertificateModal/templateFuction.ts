export const getSwadhaarTemplate = ({
  holderName,
  levelName,
  logoBase64,
  isPdf = false,
}: {
  holderName: string;
  levelName: string;
  logoBase64?: string;
  isPdf?: boolean;
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />

<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap');

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

${
  isPdf
    ? ""
    : `
html,body{
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #f5f5f5;
  font-family:'Montserrat',sans-serif;
}
`
}

.preview-wrapper{
  ${
    isPdf
      ? "display:none;"
      : `
  width:100%;
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:24px;
  `
  }
}

.scale-container{
  ${
    isPdf
      ? "display:none;"
      : `
  width:min(100%,1600px);
  aspect-ratio:16/9;
  position:relative;
  `
  }
}

.certificate-wrapper{
  width:1600px;
  height:900px;
  font-family:'Montserrat',sans-serif;

  ${
    isPdf
      ? `
  position:relative;
  `
      : `
  position:absolute;
  top:0;
  left:0;
  transform-origin:top left;
  `
  }

  background:#ffffff;
  overflow:hidden;
  border-top:60px solid #53331F;
  padding:60px 100px;
  color:#333;
  display:flex;
  flex-direction:column;
  justify-content:flex-start;
  box-shadow:${isPdf ? "none" : "0 10px 30px rgba(0,0,0,0.15)"};
  border-radius:${isPdf ? "0" : "8px"};
}

.logo-container{
  height:100px;
  margin-bottom:30px;
  display:flex;
  align-items:center;
}

.logo{
  height:100%;
  width:auto;
  max-width:400px;
  object-fit:contain;
}

.title{
  font-size:68px;
  font-weight:700;
  color:#53331F;
  margin-bottom:20px;
  line-height:1.1;
}

.subtitle{
  text-transform:uppercase;
  letter-spacing:0.3em;
  font-size:22px;
  color:#666;
  margin-bottom:25px;
}

.name{
  font-size:80px;
  font-style:italic;
  font-weight:700;
  color:#53331F;
  border-bottom:6px solid #F7941D;
  width:90%;
  padding-bottom:15px;
  margin-bottom:40px;
  line-height:1.2;
  word-break:break-word;
}

.description{
  font-size:28px;
  color:#444;
  margin-bottom:15px;
}

.course-name{
  font-size:48px;
  font-weight:700;
  color:#F7941D;
  border-bottom:2px solid #eee;
  padding-bottom:12px;
  line-height:1.3;
  width:100%;
  max-width:1200px;
}

/* Wave replacement: tilted rectangle for html2canvas compatibility */
.bottom-wave-container{
  position:absolute;
  left:0;
  bottom:0;
  width:100%;
  height:160px;
  background:#53331F;
  overflow:hidden;
  z-index:1;
}

.bottom-wave-slope{
  position:absolute;
  top:-100px;
  left:0;
  width:100%;
  height:200px;
  background:#ffffff;
  transform:skewY(-4deg);
  transform-origin:top left;
}

.circle{
  position:absolute;
  right:-50px;
  bottom:-50px;
  width:240px;
  height:240px;
  border-radius:50%;
  background:#F7941D;
  opacity:0.9;
  z-index:2;
}
</style>
</head>

<body>

${
  isPdf
    ? `
<div class="certificate-wrapper" id="certificate-pdf">
`
    : `
<div class="preview-wrapper">
  <div class="scale-container">
    <div class="certificate-wrapper" id="certificate">
`
}

<div class="logo-container">
${
  logoBase64
    ? `<img src="${logoBase64}" class="logo" />`
    : ""
}
</div>

<div class="title">
  Certificate of Completion
</div>

<div class="subtitle">
  This certificate is presented to
</div>

<div class="name">
  ${holderName}
</div>

<div class="description">
  For successfully completing the
</div>

<div class="course-name">
  ${levelName}
</div>

<div class="circle"></div>

<div class="bottom-wave-container">
  <div class="bottom-wave-slope"></div>
</div>

${
  isPdf
    ? `
</div>
`
    : `
    </div>
  </div>
</div>

<script>
function scaleCertificate() {
  const certificate = document.getElementById('certificate');
  const container = document.querySelector('.scale-container');
  if (!certificate || !container) return;
  const containerWidth = container.offsetWidth;
  const scale = containerWidth / 1600;
  certificate.style.transform = \`scale(\${scale})\`;
  container.style.height = \`\${900 * scale}px\`;
}
window.addEventListener('resize', scaleCertificate);
window.onload = scaleCertificate;
</script>
`
}

</body>
</html>
`;
};