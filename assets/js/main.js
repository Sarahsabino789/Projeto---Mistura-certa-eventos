// Mistura Certa — interações
// >>> Troque pelo número real (DDI + DDD + número, só dígitos)
const WHATSAPP_NUMBER = "5521999999999";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// Header: fundo ao rolar + menu mobile
const header = $("#header");
const menu = $("#menu");
const toggle = $("#menu-toggle");
const onScroll = () => header.classList.toggle("bg-[#121212]/90", scrollY > 20);
onScroll();
addEventListener("scroll", onScroll, { passive: true });

toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("hidden") === false;
  toggle.setAttribute("aria-expanded", open);
});
$$("#menu a").forEach((a) => a.addEventListener("click", () => {
  menu.classList.add("hidden");
  toggle.setAttribute("aria-expanded", "false");
}));

// Revelação ao entrar na tela
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.15 });
$$(".reveal").forEach((el) => io.observe(el));

// Carrossel simples
$$("[data-carousel]").forEach((root) => {
  const slides = $$(".slide", root);
  const dots = $(".dots", root);
  let i = 0, timer;
  slides.forEach((_, n) => dots.insertAdjacentHTML("beforeend", `<span class="dot"></span>`));
  const dotEls = $$(".dot", dots);
  const show = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("active", k === i));
    dotEls.forEach((d, k) => d.classList.toggle("active", k === i));
  };
  const play = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), 5000); };
  $$("[data-dir]", root).forEach((b) => b.addEventListener("click", () => { show(i + +b.dataset.dir); play(); }));
  show(0);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) play();
});

// Filtro da galeria
const chips = $$(".chip");
const items = $$("[data-cat]");
chips.forEach((c) => c.addEventListener("click", () => {
  chips.forEach((x) => { x.classList.toggle("active", x === c); x.setAttribute("aria-pressed", x === c); });
  items.forEach((it) => it.classList.toggle("hidden", it.dataset.cat !== c.dataset.filter));
}));

// Orçamento rápido (hero) → preenche o formulário
$("#quick-form").addEventListener("submit", (e) => {
  e.preventDefault();
  $("#f-tipo").value = $("#q-tipo").value;
  $("#f-data").value = $("#q-data").value;
  $("#f-convidados").value = $("#q-convidados").value;
  $("#contato").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => $("#f-nome").focus({ preventScroll: true }), 600);
});

// Formulário → WhatsApp
$("#quote-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const data = f.get("data") ? f.get("data").split("-").reverse().join("/") : "a definir";
  const msg =
    `Olá! Gostaria de um orçamento.\n\n` +
    `*Nome:* ${f.get("nome")}\n*Evento:* ${f.get("tipo")}\n` +
    `*Região:* ${f.get("regiao")}\n*Bairro:* ${f.get("bairro")}\n` +
    `*Data:* ${data}\n*Convidados:* ${f.get("convidados")}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
});

$("#year").textContent = new Date().getFullYear();