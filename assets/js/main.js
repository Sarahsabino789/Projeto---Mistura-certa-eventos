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
  slides.forEach(() => { const d = document.createElement("span"); d.className = "dot"; dots.appendChild(d); });
  const dotEls = $$(".dot", dots);
  const show = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle("active", k === i); s.setAttribute("aria-hidden", k !== i); });
    dotEls.forEach((d, k) => d.classList.toggle("active", k === i));
  };
  const play = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), 5000); };
  const stop = () => clearInterval(timer);
  $$("[data-dir]", root).forEach((b) => b.addEventListener("click", () => { show(i + +b.dataset.dir); play(); }));
  show(0);
  if (!reduceMotion) {
    play();
    // Pausa enquanto o mouse está em cima ou o foco está dentro do carrossel
    root.addEventListener("mouseenter", stop); root.addEventListener("mouseleave", play);
    root.addEventListener("focusin", stop); root.addEventListener("focusout", play);
  }
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
const clearErr = (root) => {
  root.querySelectorAll(".err").forEach((m) => m.remove());
  root.querySelectorAll(".invalid").forEach((x) => { x.classList.remove("invalid"); x.removeAttribute("aria-invalid"); });
};
const showErr = (host, text, field) => {
  clearErr(host);
  if (field) { field.classList.add("invalid"); field.setAttribute("aria-invalid", "true"); }
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
  if (!Number.isInteger(conv) || conv < 30 || conv > 500) erros.push(["convidados", "Informe de 30 a 500 convidados."]);
  const sel = f.getAll("servicos");
  if (!sel.length) erros.push(["servicos", "Escolha pelo menos um serviço."]);

  clearErr(quoteForm);
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
  const msg = `${saudacao()}, me chamo ${nome} e gostaria de fazer um orçamento:\n\n*Evento:* ${f.get("tipo")}\n*Serviços:* ${servicos}\n*Região:* ${f.get("regiao")}\n*Bairro:* ${f.get("bairro").trim()}\n*Data:* ${dataBR}\n*Convidados:* ${conv}`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  openWhats(url);
});

// Foto ampliada (galeria e convidados): só navega entre as fotos visíveis (respeita o filtro)
const lb = $("#lightbox"), lbImg = $("img", lb), lbVid = $("video", lb);
let lbList = [], lbI = 0;
// Vídeos da galeria: a miniatura (<img data-video>) abre o vídeo inteiro no lightbox, em tela cheia e sem corte
const lbStopVideo = () => { lbVid.pause(); lbVid.hidden = true; lbVid.removeAttribute("src"); lbVid.removeAttribute("poster"); lbVid.load(); };
const lbShow = (n) => {
  lbI = (n + lbList.length) % lbList.length;
  const el = lbList[lbI], video = el.dataset.video;
  if (video) {
    lbImg.hidden = true; lbVid.hidden = false;
    lbVid.poster = el.currentSrc || el.src; lbVid.src = video; lbVid.setAttribute("aria-label", el.alt.replace(/^Reproduzir vídeo: /, ""));
    lbVid.play().catch(() => {});
  } else {
    lbStopVideo(); lbImg.hidden = false;
    lbImg.src = el.currentSrc || el.src; lbImg.alt = el.alt;
  }
};
const openZoom = (root, img) => { lbList = $$("img", root).filter((im) => im.offsetParent !== null); lbShow(lbList.indexOf(img)); lb.showModal(); };
$$(".zoomable").forEach((root) => {
  $$("img", root).forEach((im) => { im.tabIndex = 0; im.setAttribute("role", "button"); });
  root.addEventListener("click", (e) => { const img = e.target.closest("img"); if (img) openZoom(root, img); });
  root.addEventListener("keydown", (e) => {
    const img = e.target.closest("img");
    if (img && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openZoom(root, img); }
  });
});
lb.addEventListener("click", (e) => {
  const b = e.target.closest("[data-lb]");
  if (b) { b.dataset.lb === "close" ? lb.close() : lbShow(lbI + +b.dataset.lb); }
  else if (e.target === lb || e.target.classList.contains("lb-wrap")) lb.close();
});
lb.addEventListener("close", lbStopVideo);   // fechar (X, fundo ou Esc) para o vídeo e libera o arquivo
addEventListener("keydown", (e) => { if (!lb.open || e.target === lbVid) return; if (e.key === "ArrowLeft") lbShow(lbI - 1); if (e.key === "ArrowRight") lbShow(lbI + 1); });

$("#year").textContent = new Date().getFullYear();

// GSAP + ScrollTrigger: fade-up suave só em títulos/cards permitidos (Header, Hero, Galeria, Formulário, Footer e os 3 artigos após o Hero ficam de fora)
if (window.gsap && window.ScrollTrigger && !reduceMotion) {
  gsap.registerPlugin(ScrollTrigger);
  if (window.ScrollSmoother) gsap.registerPlugin(window.ScrollSmoother);
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
      if (t.hasAttribute("tabindex")) t.focus({ preventScroll: true });
    }));
  }
  const from = { autoAlpha: 0, y: 32, duration: .9, ease: "power3.out", clearProps: "transform,opacity,visibility" };
  $$("[data-anim]").forEach((el) => gsap.from(el, { ...from, scrollTrigger: { trigger: el, start: "top 88%", once: true } }));
  // Drinks: itens surgem um a um, em sequência, acompanhando a rolagem
  $$("[data-drinks]").forEach((box) => {
    gsap.timeline({ scrollTrigger: { trigger: box, start: "top 82%", end: "bottom 60%", scrub: .6 } })
      .from(box.children, { autoAlpha: 0, y: 36, duration: 1, stagger: .6, ease: "power2.out" });
  });
  // Surgimento ligado à rolagem (reversível, sem repetir "só uma vez"): equipe e bastidores; "soft" = mais sutil (Como funciona)
  $$("[data-scrub]").forEach((el) => gsap.fromTo(el, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, ease: "none",
    scrollTrigger: { trigger: el, start: "top 95%", end: "top 72%", scrub: .5 } }));
  $$("[data-scrub-soft]").forEach((el) => gsap.fromTo(el, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, ease: "none",
    scrollTrigger: { trigger: el, start: "top 98%", end: "top 70%", scrub: .8 } }));
  // Chips da galeria: onda em sequência toda vez que a seção volta à tela
  $$("[data-wave]").forEach((box) => gsap.from(box.children, { autoAlpha: 0, y: 18, duration: .55, stagger: .12, ease: "power2.out",
    scrollTrigger: { trigger: box, start: "top 92%", end: "bottom top", toggleActions: "play reset play reset" } }));
  // Sobre: as 3 pílulas entram da esquerda, uma atrás da outra; reinicia toda vez que a seção volta à tela
  $$("[data-pills]").forEach((ul) => {
    const tl = gsap.from(ul.children, { autoAlpha: 0, x: -36, duration: .6, stagger: .25, ease: "power2.out", paused: true });
    ScrollTrigger.create({ trigger: ul, start: "top 92%", end: "bottom top",
      onEnter: () => tl.restart(), onEnterBack: () => tl.restart(),
      onLeave: () => tl.pause(0), onLeaveBack: () => tl.pause(0) });
  });
  // Artigos 1, 2 e 3: só a imagem (no 1º, o carrossel), sutil, ligada à rolagem; texto fica estático
  $$("#servicos article").forEach((art, i) => {
    const media = $(".svc-media", art);
    if (media) gsap.fromTo(media, { scale: .94, autoAlpha: .6 }, { scale: 1, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: media, start: "top 95%", end: "top 60%", scrub: .5 } });
  });
  // Depoimentos: 1º card entra normal; 2º e 3º crescem de 0.8 para 1 conforme entram na tela
  $$(".dep-item").forEach((el, i) => {
    if (i === 0) return gsap.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, ease: "none", scrollTrigger: { trigger: el, start: "top 100%", end: "top 75%", scrub: .5 } });
    gsap.fromTo(el, { scale: .8, autoAlpha: .5, transformOrigin: "50% 50%" },
      { scale: 1, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 100%", end: "bottom 80%", scrub: .5 } });
  });
}

// Card "Como funciona": fumaça/tinta fluida (simulação de fluido em WebGL, no estilo do vídeo de referência).
// Mouse e toque injetam cor e velocidade; a tinta gira em redemoinhos e vai sumindo devagar. Sem sensores de movimento.
const liquid = $("#liquid");
if (liquid) {
  const card = liquid.parentElement;
  const gl = liquid.getContext("webgl2", { alpha: false, depth: false, stencil: false, antialias: false, powerPreference: "low-power" });
  try {
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) throw new Error("sem WebGL2");
    const rnd = (a, b) => a + Math.random() * (b - a);
    const cl = (v, a, b) => v < a ? a : v > b ? b : v;
    const CFG = { sim: isTouch ? 96 : 128, dye: isTouch ? 384 : 640, iter: isTouch ? 14 : 18, dens: 1.5, vel: .3, pres: .8, curl: 28, radius: .0032, force: 5200 };
    const PAL = [[176, 22, 36], [128, 14, 30], [214, 52, 36], [150, 18, 32], [232, 96, 38]];   // cores da marca: laranja, vermelho-brasa, vinho, âmbar

    // ----- shaders -----
    const VS = `#version 300 es
precision highp float;
in vec2 aPos; out vec2 vUv, vL, vR, vT, vB; uniform vec2 texelSize;
void main(){ vUv = aPos * .5 + .5; vL = vUv - vec2(texelSize.x, 0.); vR = vUv + vec2(texelSize.x, 0.); vT = vUv + vec2(0., texelSize.y); vB = vUv - vec2(0., texelSize.y); gl_Position = vec4(aPos, 0., 1.); }`;
    const FH = `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB; out vec4 o;
`;
    const mk = (src) => {
      const p = gl.createProgram();
      for (const [t, s] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FH + src]]) {
        const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
        gl.attachShader(p, sh);
      }
      gl.bindAttribLocation(p, 0, "aPos"); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {}; for (let i = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) - 1; i >= 0; i--) { const n = gl.getActiveUniform(p, i).name; u[n] = gl.getUniformLocation(p, n); }
      return { p, u };
    };
    const P = {
      clear: mk(`uniform sampler2D uTexture; uniform float value; void main(){ o = value * texture(uTexture, vUv); }`),
      splat: mk(`uniform sampler2D uTarget; uniform float aspect; uniform vec3 color; uniform vec2 point; uniform float radius;
        void main(){ vec2 p = vUv - point; p.x *= aspect; o = vec4(texture(uTarget, vUv).xyz + exp(-dot(p, p) / radius) * color, 1.); }`),
      adv: mk(`uniform sampler2D uVelocity, uSource; uniform vec2 texelSize; uniform float dt, dissipation;
        void main(){ vec2 c = vUv - dt * texture(uVelocity, vUv).xy * texelSize; o = texture(uSource, c) / (1. + dissipation * dt); }`),
      div: mk(`uniform sampler2D uVelocity;
        void main(){ float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x, T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y; vec2 C = texture(uVelocity, vUv).xy;
          if (vL.x < 0.) L = -C.x; if (vR.x > 1.) R = -C.x; if (vT.y > 1.) T = -C.y; if (vB.y < 0.) B = -C.y; o = vec4(.5 * (R - L + T - B), 0., 0., 1.); }`),
      curl: mk(`uniform sampler2D uVelocity;
        void main(){ float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y, T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x; o = vec4(.5 * (R - L - T + B), 0., 0., 1.); }`),
      vort: mk(`uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
        void main(){ float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x, T = texture(uCurl, vT).x, B = texture(uCurl, vB).x, C = texture(uCurl, vUv).x;
          vec2 f = .5 * vec2(abs(T) - abs(B), abs(R) - abs(L)); f /= length(f) + .0001; f *= curl * C; f.y *= -1.;
          o = vec4(clamp(texture(uVelocity, vUv).xy + f * dt, -1000., 1000.), 0., 1.); }`),
      pres: mk(`uniform sampler2D uPressure, uDivergence;
        void main(){ float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x; o = vec4((L + R + B + T - texture(uDivergence, vUv).x) * .25, 0., 0., 1.); }`),
      grad: mk(`uniform sampler2D uPressure, uVelocity;
        void main(){ float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x; o = vec4(texture(uVelocity, vUv).xy - vec2(R - L, T - B), 0., 1.); }`),
      show: mk(`uniform sampler2D uTexture;
        void main(){ vec3 c = 1. - exp(-texture(uTexture, vUv).rgb * 1.25); vec3 b = vec3(.02); o = vec4(b + c * (1. - b), 1.); }`),   // curva suave: sem estourar em branco
    };
    gl.bindVertexArray(gl.createVertexArray());
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // ----- texturas / framebuffers -----
    const mkFbo = (w, h, filter) => {
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("framebuffer incompleto");
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex, fb, w, h, tx: 1 / w, ty: 1 / h };
    };
    const mkDbl = (w, h, f) => { let a = mkFbo(w, h, f), b = mkFbo(w, h, f); return { get r() { return a; }, get w() { return b; }, swap() { [a, b] = [b, a]; } }; };
    let vel, dye, divg, curl, pres, aspect = 1;
    const res = (r) => { let a = liquid.width / liquid.height; if (a < 1) a = 1 / a; const mn = Math.round(r), mx = Math.round(r * a); return liquid.width > liquid.height ? [mx, mn] : [mn, mx]; };
    const build = () => {
      const w = card.clientWidth, h = card.clientHeight; if (!w || !h) return false;
      const d = Math.min(devicePixelRatio || 1, 1.5); liquid.width = Math.round(w * d); liquid.height = Math.round(h * d); aspect = liquid.width / liquid.height;
      const [sw, sh] = res(CFG.sim), [dw, dh] = res(CFG.dye);
      vel = mkDbl(sw, sh, gl.LINEAR); dye = mkDbl(dw, dh, gl.LINEAR); divg = mkFbo(sw, sh, gl.NEAREST); curl = mkFbo(sw, sh, gl.NEAREST); pres = mkDbl(sw, sh, gl.NEAREST);
      return true;
    };

    // ----- passos da simulação -----
    const use = (pr, t) => { gl.useProgram(pr.p); if (t) gl.uniform2f(pr.u.texelSize, t.tx, t.ty); return pr; };
    const bind = (loc, fbo, unit) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, fbo.tex); gl.uniform1i(loc, unit); };
    const blit = (t) => {
      if (t) { gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb); gl.viewport(0, 0, t.w, t.h); } else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, liquid.width, liquid.height); }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const step = (dt) => {
      let p = use(P.curl, vel.r); bind(p.u.uVelocity, vel.r, 0); blit(curl);
      p = use(P.vort, vel.r); bind(p.u.uVelocity, vel.r, 0); bind(p.u.uCurl, curl, 1); gl.uniform1f(p.u.curl, CFG.curl); gl.uniform1f(p.u.dt, dt); blit(vel.w); vel.swap();
      p = use(P.div, vel.r); bind(p.u.uVelocity, vel.r, 0); blit(divg);
      p = use(P.clear); bind(p.u.uTexture, pres.r, 0); gl.uniform1f(p.u.value, CFG.pres); blit(pres.w); pres.swap();
      p = use(P.pres, vel.r); bind(p.u.uDivergence, divg, 0);
      for (let i = 0; i < CFG.iter; i++) { bind(p.u.uPressure, pres.r, 1); blit(pres.w); pres.swap(); }
      p = use(P.grad, vel.r); bind(p.u.uPressure, pres.r, 0); bind(p.u.uVelocity, vel.r, 1); blit(vel.w); vel.swap();
      p = use(P.adv, vel.r); bind(p.u.uVelocity, vel.r, 0); bind(p.u.uSource, vel.r, 1); gl.uniform1f(p.u.dt, dt); gl.uniform1f(p.u.dissipation, CFG.vel); blit(vel.w); vel.swap();
      bind(p.u.uVelocity, vel.r, 0); bind(p.u.uSource, dye.r, 1); gl.uniform1f(p.u.dissipation, CFG.dens); blit(dye.w); dye.swap();
    };
    const splat = (x, y, dx, dy, c, big) => {
      const r = (aspect > 1 ? CFG.radius * aspect : CFG.radius) * (big ? 2.4 : 1);
      let p = use(P.splat); gl.uniform1f(p.u.aspect, aspect); gl.uniform2f(p.u.point, x, y); gl.uniform1f(p.u.radius, r);
      bind(p.u.uTarget, vel.r, 0); gl.uniform3f(p.u.color, dx, dy, 0); blit(vel.w); vel.swap();
      bind(p.u.uTarget, dye.r, 0); gl.uniform3f(p.u.color, c[0], c[1], c[2]); blit(dye.w); dye.swap();
    };
    const draw = () => { const p = use(P.show); bind(p.u.uTexture, dye.r, 0); blit(null); };

    // ----- cor e entrada (mouse / toque) -----
    const color = (k) => { const f = (performance.now() / 1000 * .45) % PAL.length, i = f | 0, a = PAL[i], b = PAL[(i + 1) % PAL.length], q = f - i; return [0, 1, 2].map((j) => (a[j] + (b[j] - a[j]) * q) / 255 * k); };
    const queue = []; let prev = null, touched = false, visible = false, started = false, last = performance.now();
    const push = (x, y, dx, dy, k, big) => { if (queue.length < 24) queue.push({ x, y, dx, dy, k, big }); };
    const uv = (cx, cy) => { const r = card.getBoundingClientRect(); return [(cx - r.left) / r.width, 1 - (cy - r.top) / r.height]; };
    const move = (cx, cy) => {
      const [x, y] = uv(cx, cy);
      if (prev) {
        let dx = x - prev[0], dy = y - prev[1];
        if (aspect < 1) dx *= aspect; if (aspect > 1) dy /= aspect;
        if (dx || dy) push(x, y, dx * CFG.force, dy * CFG.force, .12, false);
      }
      prev = [x, y]; touched = true;
    };
    const burst = (cx, cy, n) => { const [x, y] = uv(cx, cy); for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), f = rnd(300, 900); push(x, y, Math.cos(a) * f, Math.sin(a) * f, .12, true); } touched = true; };
    const auto = (n) => { for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), f = rnd(500, 1300); push(rnd(.4, .95), rnd(.15, .85), Math.cos(a) * f, Math.sin(a) * f, .26, true); } };   // empurrão automático para mostrar que reage

    if (!reduceMotion) {
      card.addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") move(e.clientX, e.clientY); });
      card.addEventListener("pointerleave", () => { prev = null; });
      card.addEventListener("pointerdown", (e) => { if (e.pointerType !== "touch") burst(e.clientX, e.clientY, 2); });
      // toque: listeners passivos, a tinta segue o dedo mesmo quando a página rola junto
      card.addEventListener("touchstart", (e) => { prev = null; move(e.touches[0].clientX, e.touches[0].clientY); burst(e.touches[0].clientX, e.touches[0].clientY, 1); }, { passive: true });
      card.addEventListener("touchmove", (e) => move(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
      card.addEventListener("touchend", () => { prev = null; }); card.addEventListener("touchcancel", () => { prev = null; });
    }

    // ----- laço -----
    const frame = () => {
      if (!visible || !vel) return;
      const now = performance.now(), dt = cl((now - last) / 1000, 1 / 240, 1 / 60); last = now;
      for (const s of queue.splice(0)) splat(s.x, s.y, s.dx, s.dy, color(s.k), s.big);
      step(dt); draw();
    };
    if (!build()) throw new Error("card sem tamanho");
    if (reduceMotion) {   // sem animação: uma fumaça parada, já desenhada
      auto(5); for (const s of queue.splice(0)) splat(s.x, s.y, s.dx, s.dy, color(s.k), s.big);
      for (let i = 0; i < 70; i++) step(1 / 60);
      draw(); liquid.classList.add("on");
    } else {
      let lw = card.clientWidth, lh = card.clientHeight;
      new ResizeObserver(() => { if (Math.abs(card.clientWidth - lw) > 1 || Math.abs(card.clientHeight - lh) > 1) { lw = card.clientWidth; lh = card.clientHeight; build(); } }).observe(card);
      const onVis = (v) => {   // só simula enquanto o card está na tela
        visible = v; last = performance.now();
        if (v && !started) { started = true; setTimeout(() => { if (!touched) auto(3); }, 500); setInterval(() => { if (visible && !touched) auto(1); }, 9000); }
      };
      if (window.gsap && window.ScrollTrigger) { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.create({ trigger: card, start: "top 95%", end: "bottom 5%", onToggle: (s) => onVis(s.isActive) }); }
      else new IntersectionObserver(([e]) => onVis(e.isIntersecting), { threshold: .15 }).observe(card);
      if (window.gsap) gsap.ticker.add(frame); else { const loop = () => { frame(); requestAnimationFrame(loop); }; loop(); }
      draw(); liquid.classList.add("on");
      // Dica (não é botão): visível enquanto ninguém interage; some ao pairar/tocar e volta ao sair/soltar
      const setHint = (on) => card.classList.toggle("hint-off", !on);
      let hintTimer;
      card.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") setHint(false); });
      card.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") setHint(true); });
      card.addEventListener("touchstart", () => { clearTimeout(hintTimer); setHint(false); }, { passive: true });
      const hintBack = () => { clearTimeout(hintTimer); hintTimer = setTimeout(() => setHint(true), 2500); };
      card.addEventListener("touchend", hintBack); card.addEventListener("touchcancel", hintBack);
      card.classList.add("has-hint");
    }
  } catch (err) {
    console.warn("Fumaça fluida indisponível:", err); card.classList.add("no-fluid");
  }
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
