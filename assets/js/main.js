// Número do WhatsApp que recebe os orçamentos (DDI+DDD+número)
const WHATSAPP_NUMBER = "5521969387635";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const menu = $("#menu"), toggle = $("#menu-toggle");
const setMenu = (open) => { menu.classList.toggle("hidden", !open); toggle.setAttribute("aria-expanded", open); };
toggle.addEventListener("click", () => setMenu(menu.classList.contains("hidden")));
$$("#menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

// Carrossel de "O que fazemos": autoplay 5s (desligado se o usuário prefere menos movimento)
$$("[data-carousel]").forEach((root) => {
  const slides = $$(".slide", root), dots = $(".dots", root);
  let i = 0, timer;
  slides.forEach(() => dots.insertAdjacentHTML("beforeend", "<span class='dot'></span>"));
  const dotEls = $$(".dot", dots);
  const show = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle("active", k === i); s.setAttribute("aria-hidden", k !== i); });
    dotEls.forEach((d, k) => d.classList.toggle("active", k === i));
  };
  const play = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), 5000); };
  $$("[data-dir]", root).forEach((b) => b.addEventListener("click", () => { show(i + +b.dataset.dir); play(); }));
  show(0);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) play();
});

// Filtro da galeria: mostra só a categoria do chip ativo
const chips = $$(".chip"), items = $$("[data-cat]");
chips.forEach((c) => c.addEventListener("click", () => {
  chips.forEach((x) => { x.classList.toggle("active", x === c); x.setAttribute("aria-pressed", x === c); });
  items.forEach((it) => it.classList.toggle("hidden", it.dataset.cat !== c.dataset.filter));
}));

// Monta a mensagem do formulário e abre o WhatsApp
$("#quote-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const data = f.get("data") ? f.get("data").split("-").reverse().join("/") : "a definir";
  const msg = `Olá! Gostaria de um orçamento.\n\n*Nome:* ${f.get("nome")}\n*Evento:* ${f.get("tipo")}\n*Região:* ${f.get("regiao")}\n*Bairro:* ${f.get("bairro")}\n*Data:* ${data}\n*Convidados:* ${f.get("convidados")}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
});

// Lightbox: só navega entre as fotos visíveis (respeita o filtro)
const lb = $("#lightbox"), lbImg = $("img", lb);
let lbList = [], lbI = 0;
const lbShow = (n) => { lbI = (n + lbList.length) % lbList.length; lbImg.src = lbList[lbI].currentSrc || lbList[lbI].src; lbImg.alt = lbList[lbI].alt; };
$$(".zoomable").forEach((root) => root.addEventListener("click", (e) => {
  const img = e.target.closest("img"); if (!img) return;
  lbList = $$("img", root).filter((im) => im.offsetParent !== null);
  lbShow(lbList.indexOf(img)); lb.showModal();
}));
lb.addEventListener("click", (e) => {
  const b = e.target.closest("[data-lb]");
  if (b) { b.dataset.lb === "close" ? lb.close() : lbShow(lbI + +b.dataset.lb); }
  else if (e.target === lb || e.target.classList.contains("lb-wrap")) lb.close();
});
addEventListener("keydown", (e) => { if (!lb.open) return; if (e.key === "ArrowLeft") lbShow(lbI - 1); if (e.key === "ArrowRight") lbShow(lbI + 1); });

$("#year").textContent = new Date().getFullYear();
