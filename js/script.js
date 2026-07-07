// Ano no rodapé
document.getElementById("year").textContent = new Date().getFullYear();

// Menu mobile
const navToggle = document.getElementById("nav-toggle");
const mainNav = document.getElementById("main-nav");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Acordeão de impacto ambiental por material
document.querySelectorAll("#impact-accordion .accordion-item").forEach((item) => {
  item.addEventListener("click", () => {
    const isOpen = item.getAttribute("aria-expanded") === "true";
    document.querySelectorAll("#impact-accordion .accordion-item").forEach((other) => {
      other.setAttribute("aria-expanded", "false");
    });
    item.setAttribute("aria-expanded", isOpen ? "false" : "true");
  });
});

// Modal com informações de cada material reciclável
const materialInfo = {
  papelao: {
    title: "Papelão",
    text: "Embalagens de papel ondulado (caixas de transporte e mercadoria). É um dos materiais mais reciclados no Brasil: pode ser transformado repetidas vezes em nova celulose para caixas e papel, reduzindo a necessidade de corte de árvores."
  },
  papel: {
    title: "Papel",
    text: "Papel de escritório, jornal, revista e papel branco ou misto. Depois de triado, é reprocessado em fábricas de celulose e papel, voltando ao mercado como papel reciclado, papelão ou embalagens."
  },
  pet: {
    title: "PET (código 1)",
    text: "Garrafas de refrigerante, água e óleo. É um dos plásticos mais valorizados no mercado de reciclagem, sendo transformado em fibras para tecidos, novas garrafas e embalagens."
  },
  pead: {
    title: "PEAD (código 2)",
    text: "Embalagens de produtos de limpeza, shampoo e tampas rígidas. Após reciclado, se transforma em tubos, baldes, mobiliário plástico e novas embalagens."
  },
  pp: {
    title: "PP (código 5)",
    text: "Potes de margarina, embalagens de alimentos e tampas. É reciclado em peças automotivas, utensílios domésticos e outros itens plásticos resistentes."
  },
  misto: {
    title: "Plástico misto",
    text: "Mistura de plásticos variados (sacolas, embalagens diversas) que não foram segregados por tipo. É separado e encaminhado conforme o tipo de resina predominante identificado na triagem."
  },
  aluminio: {
    title: "Alumínio",
    text: "Latas de bebida e embalagens de alumínio. É um dos materiais com maior valor de mercado e pode ser reciclado indefinidamente, economizando até 95% da energia necessária para produzir alumínio primário."
  },
  sucata: {
    title: "Sucatas metálicas",
    text: "Ferro, aço, cobre e outros metais recolhidos na coleta. São encaminhados a siderúrgicas e fundições parceiras para reaproveitamento como matéria-prima industrial."
  }
};

const materialModal = document.getElementById("material-modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");

document.querySelectorAll(".material-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const key = chip.getAttribute("data-material");
    const info = materialInfo[key];
    if (!info || !materialModal) return;
    modalTitle.textContent = info.title;
    modalBody.textContent = info.text;
    materialModal.hidden = false;
  });
});

function closeMaterialModal() {
  if (materialModal) materialModal.hidden = true;
}

if (modalClose) modalClose.addEventListener("click", closeMaterialModal);
if (materialModal) {
  materialModal.addEventListener("click", (e) => {
    if (e.target === materialModal) closeMaterialModal();
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMaterialModal();
});

// Formulário de contato (estático — apenas feedback visual)
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    alert(
      "Obrigado pelo contato! Este formulário ainda não está conectado a um serviço de envio.\n" +
      "Configure um serviço como o Formspree, ou substitua este formulário por um link direto de e-mail/WhatsApp."
    );
    contactForm.reset();
  });
}
