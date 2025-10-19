const text = "Eu disse que ia te dar a lua, ainda não consegui trazer a de verdade, mas te dou essa <3";
let i = 0;
function typeWriter() {
  const el = document.getElementById("typed-text");
  if (!el) return;
  if (i < text.length) {
    el.innerHTML += text.charAt(i++);
    setTimeout(typeWriter, 80);
  }
}
window.addEventListener("load", typeWriter);
