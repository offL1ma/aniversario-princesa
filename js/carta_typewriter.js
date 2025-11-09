(function () {
  const prefersReduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const el = document.getElementById("letter-text");
  if (!el) return;

  // pega o texto que você escreveu no HTML
  const original = el.textContent.trim();
  if (!original) return;

  // se a pessoa prefere menos movimento, mostra tudo de uma vez
  if (prefersReduce) {
    el.textContent = original;
    return;
  }

  let i = 0;
  el.textContent = "";

  function type() {
    if (i < original.length) {
      el.textContent += original.charAt(i);
      i++;
      // ajuste aqui a velocidade da escrita (ms por letra)
      setTimeout(type, 60);
    }
  }

  window.addEventListener("load", type);

  // pequena graça: desenhar estrelas com atraso
  const stars = document.querySelectorAll(".hand-star");
  stars.forEach((star, index) => {
    star.style.animationDelay = `${0.6 + index * 0.25}s`;
  });
})();
