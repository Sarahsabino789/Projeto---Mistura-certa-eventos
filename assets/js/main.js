// Número do WhatsApp que recebe os orçamentos (DDI+DDD+número)
const WHATSAPP_NUMBER = "5521969387635";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const isTouch = matchMedia("(hover: none)").matches;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Menu mobile
const menu = $("#menu"), toggle = $("#menu-toggle");
const setMenu = (open) => { menu.classList.toggle("hidden", !open); toggle.setAttribute("aria-expanded", open); };
toggle.addEventListener("click", () => setMenu(menu.classList.contains("hidden")));
$$("#menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

// Header: fundo sólido assim que a rolagem começa (mais confiável que depender só de CSS)
const header = $("#header");
const onScroll = () => header.classList.toggle("scrolled", scrollY > 8);
onScroll();
addEventListener("scroll", onScroll, { passive: true });

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
  if (!reduceMotion) play();
});

// Filtro da galeria: mostra só a categoria do chip ativo
const chips = $$(".chip"), items = $$("[data-cat]");
chips.forEach((c) => c.addEventListener("click", () => {
  chips.forEach((x) => { x.classList.toggle("active", x === c); x.setAttribute("aria-pressed", x === c); });
  items.forEach((it) => it.classList.toggle("hidden", it.dataset.cat !== c.dataset.filter));
}));

// Contadores do hero: conta de 1 até o valor final sempre que a seção volta a aparecer na tela
const heroStats = $(".hero-stats");
if (heroStats) {
  const stats = $$("strong", heroStats).map((el) => {
    const m = el.textContent.trim().match(/^(\d+)(.*)$/);
    return { el, end: m ? parseInt(m[1], 10) : 0, suffix: m ? m[2] : "", raw: el.textContent };
  });
  const runCount = ({ el, end, suffix }) => {
    if (reduceMotion) { el.textContent = end + suffix; return; }
    const dur = 900, t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(1 + (end - 1) * p) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) stats.forEach(runCount); });
  }, { threshold: .4 }).observe(heroStats);
}

// WhatsApp sempre em NOVA ABA (site continua aberto), inclusive no celular.
// Clique real e síncrono de <a target="_blank"> dentro do gesto do usuário: não é bloqueado como popup.
// (Os links wa.me do HTML já têm target="_blank" e abrem nativamente; o feedback de toque vem do :active do CSS.)
const openWhats = (url) => {
  const a = document.createElement("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
  document.body.appendChild(a); a.click(); a.remove();
};

// Saudação pelo horário de Brasília
const saudacao = () => {
  const h = +new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date());
  return h >= 5 && h < 12 ? "Bom dia" : h >= 12 && h < 18 ? "Boa tarde" : "Boa noite";
};
const waFloat = $("#wa-float");
if (waFloat) waFloat.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(saudacao() + "! Gostaria de um orçamento.")}`;

// Formulário: valida tudo, mostra o erro em cada campo e só então abre o WhatsApp
const quoteForm = $("#quote-form");
const dataEl = $("#f-data");
const hoje = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
dataEl.min = hoje;
const clearErr = (root) => { root.querySelectorAll(".err").forEach((m) => m.remove()); root.querySelectorAll(".invalid").forEach((x) => x.classList.remove("invalid")); };
const showErr = (host, text, field) => {
  clearErr(host);
  if (field) field.classList.add("invalid");
  const s = document.createElement("span");
  s.className = "err" + (field ? "" : " err-group");
  s.textContent = text;
  host.appendChild(s);
};
const groupOf = (el) => el.closest("fieldset") || el.closest("label");
const LABELS = { nome: "Nome completo", tipo: "Tipo de evento", regiao: "Região do evento", bairro: "Bairro do evento", data: "Data do evento", convidados: "Número de convidados", servicos: "Serviços desejados" };
const summary = $("#qf-summary");
// Aviso geral: lista o que ainda falta e some quando tudo estiver preenchido
const syncSummary = () => {
  const faltam = $$(".err", quoteForm).map((m) => m.dataset.label).filter(Boolean);
  summary.hidden = !faltam.length;
  if (faltam.length) summary.textContent = `Falta preencher: ${faltam.join(", ")}.`;
};
const onEdit = (e) => { clearErr(groupOf(e.target) || quoteForm); syncSummary(); };
quoteForm.addEventListener("input", onEdit);
quoteForm.addEventListener("change", onEdit);

const svcAll = $("#svc-todos"), svcItems = $$(".svc-item", quoteForm);
svcAll.addEventListener("change", () => svcItems.forEach((c) => { c.checked = svcAll.checked; }));
svcItems.forEach((c) => c.addEventListener("change", () => { svcAll.checked = svcItems.every((x) => x.checked); }));

quoteForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(quoteForm);
  const erros = [];
  const nome = (f.get("nome") || "").trim();
  if (nome.length < 3) erros.push(["nome", "Informe seu nome completo."]);
  if (!f.get("tipo")) erros.push(["tipo", "Escolha o tipo de evento."]);
  if (!f.get("regiao")) erros.push(["regiao", "Selecione a região."]);
  if (!(f.get("bairro") || "").trim()) erros.push(["bairro", "Informe o bairro."]);
  if (!f.get("data")) erros.push(["data", "Informe a data do evento."]);
  else if (f.get("data") < hoje) erros.push(["data", "Escolha uma data a partir de hoje."]);
  const conv = Number(f.get("convidados"));
  if (!Number.isInteger(conv) || conv < 1) erros.push(["convidados", "Informe um número válido de convidados."]);
  const sel = f.getAll("servicos");
  if (!sel.length) erros.push(["servicos", "Escolha pelo menos um serviço."]);

  $$(".err", quoteForm).forEach((m) => m.remove());
  $$(".invalid", quoteForm).forEach((x) => x.classList.remove("invalid"));
  let primeiro = null;
  erros.forEach(([nomeCampo, texto]) => {
    const el = quoteForm.elements[nomeCampo];
    const first = el.length && !el.tagName ? el[0] : el;
    const isGroup = first.type === "radio" || first.type === "checkbox";
    const host = isGroup ? first.closest("fieldset") : first.closest("label");
    showErr(host, texto, isGroup ? null : first);
    host.querySelector(".err").dataset.label = LABELS[nomeCampo];
    if (!primeiro) primeiro = first;
  });
  syncSummary();
  if (primeiro) { primeiro.focus({ preventScroll: true }); primeiro.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" }); return; }

  const servicos = sel.length === svcItems.length ? `Todos os serviços (${sel.join(" + ")})` : sel.join(" + ");
  const dataBR = f.get("data").split("-").reverse().join("/");
  const msg = `${saudacao()}! Gostaria de um orçamento.\n\n*Nome:* ${nome}\n*Evento:* ${f.get("tipo")}\n*Serviços:* ${servicos}\n*Região:* ${f.get("regiao")}\n*Bairro:* ${f.get("bairro").trim()}\n*Data:* ${dataBR}\n*Convidados:* ${conv}`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  openWhats(url);
});

// Foto ampliada (galeria e convidados): só navega entre as fotos visíveis (respeita o filtro)
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

// GSAP + ScrollTrigger: fade-up suave só em títulos/cards permitidos (Header, Hero, Galeria, Formulário, Footer e os 3 artigos após o Hero ficam de fora)
if (window.gsap && window.ScrollTrigger && !reduceMotion) {
  gsap.registerPlugin(ScrollTrigger, window.ScrollSmoother);
  // Scroll suave (ScrollSmoother): só em mouse/desktop; no toque mantém o scroll nativo. Sem o plugin, tudo segue normal
  let smoother = null;
  if (window.ScrollSmoother && !isTouch) {
    smoother = ScrollSmoother.create({ wrapper: "#smooth-wrapper", content: "#smooth-content", smooth: 1.2, effects: false });
    document.documentElement.classList.add("has-smoother");
    // Âncoras do menu/CTAs rolam via smoother, respeitando a altura do header
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const t = a.getAttribute("href").length > 1 && $(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      smoother.scrollTo(t, true, "top 88px");
    }));
  }
  const from = { autoAlpha: 0, y: 32, duration: .9, ease: "power3.out", clearProps: "transform,opacity,visibility" };
  $$("[data-anim]").forEach((el) => gsap.from(el, { ...from, scrollTrigger: { trigger: el, start: "top 88%", once: true } }));
  // Drinks: itens surgem um a um, em sequência, acompanhando a rolagem
  $$("[data-drinks]").forEach((box) => {
    gsap.timeline({ scrollTrigger: { trigger: box, start: "top 82%", end: "bottom 60%", scrub: .6 } })
      .from(box.children, { autoAlpha: 0, y: 36, duration: 1, stagger: .6, ease: "power2.out" });
  });
  // Sobre: 3 pílulas surgem rápidas, uma após a outra; reinicia toda vez que a seção é revisitada
  $$("[data-pills]").forEach((ul) => gsap.from(ul.children, { autoAlpha: 0, y: 18, duration: .5, stagger: .12, ease: "power2.out",
    scrollTrigger: { trigger: ul, start: "top 88%", end: "bottom top", toggleActions: "play reset play reset" } }));
  // Artigos 2 e 3 (o 1º já tem carrossel): só a imagem, sutil, ligada à rolagem; texto fica estático
  $$("#servicos article").forEach((art, i) => {
    const media = i > 0 && $(".svc-media", art);
    if (media) gsap.fromTo(media, { scale: .94, autoAlpha: .6 }, { scale: 1, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: media, start: "top 95%", end: "top 60%", scrub: .5 } });
  });
  // Vídeo dos drinks: só surge (sem autoplay; o usuário aperta play) quando o usuário chega ao fim da animação da lista
  $$("[data-video-reveal]").forEach((box) => {
    gsap.from(box, { autoAlpha: 0, y: 48, duration: .9, ease: "power3.out", clearProps: "transform,opacity,visibility",
      scrollTrigger: { trigger: box, start: "top 68%", once: true } });
  });
  // Depoimentos: 1º card entra normal; 2º e 3º crescem de 0.8 para 1 conforme entram na tela
  $$(".dep-item").forEach((el, i) => {
    if (i === 0) return gsap.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, ease: "none", scrollTrigger: { trigger: el, start: "top 100%", end: "top 75%", scrub: .5 } });
    gsap.fromTo(el, { scale: .8, autoAlpha: .5, transformOrigin: "50% 50%" },
      { scale: 1, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 100%", end: "bottom 80%", scrub: .5 } });
  });
}

// Card líquido: webgl-fluid como fundo do painel de texto "Como funciona" (reage a cursor/toque); se a lib não carregar, fica o degradê estático
const liquid = $("#liquid");
if (liquid && !reduceMotion) {
  addEventListener("load", () => {
    const Fluid = window.WebGLFluid || window.webglFluid;
    if (typeof Fluid !== "function") return;
    try {
      Fluid(liquid, { TRIGGER: "hover", IMMEDIATE: false, AUTO: false, SIM_RESOLUTION: 128, DYE_RESOLUTION: 720, DENSITY_DISSIPATION: 1.8, VELOCITY_DISSIPATION: .7, PRESSURE: .8, CURL: 16, SPLAT_RADIUS: .3, SPLAT_FORCE: 5000, SHADING: true, COLORFUL: true, TRANSPARENT: false, BACK_COLOR: "#161311", BLOOM: false, SUNRAYS: false });
      liquid.classList.add("on");
    } catch (_) { /* mantém o fundo estático */ }
  });
}

// Botões primários (exceto o do hero, que já tem os sliders): bolhas de gás contínuas (independentes de :hover); pausam fora da tela
if (!reduceMotion) {
  const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("paused", !e.isIntersecting)));
  $$(".btn-primary:not(#inicio .btn-primary)").forEach((btn) => {
    const wrap = document.createElement("span");
    wrap.className = "bubbles"; wrap.setAttribute("aria-hidden", "true");
    const N = 16;
    for (let k = 0; k < N; k++) {
      const b = document.createElement("i"), s = 3 + Math.random() * 7;
      b.style.cssText = `left:${(((k + Math.random() * .8) / N) * 100).toFixed(1)}%;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;--d:${(2.4 + Math.random() * 2.6).toFixed(2)}s;--dl:-${(Math.random() * 5).toFixed(2)}s;--sx:${(Math.random() * 16 - 8).toFixed(1)}px`;
      wrap.appendChild(b);
    }
    btn.prepend(wrap); io.observe(wrap);
  });
}
