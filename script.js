/**
 * ============================================================================
 * BARBEARIA DOM NAVALHA - SISTEMA DE AGENDAMENTO & GESTÃO (JAVASCRIPT PURO)
 * ============================================================================
 * 
 * Este arquivo contém toda a lógica da aplicação:
 * 1. CONFIGURAÇÕES EDITÁVEIS (Chave Pix, Promoções, Planos, Barbeiros e Horários)
 * 2. PERSISTÊNCIA NO LOCALSTORAGE (Barbeiros e Agendamentos)
 * 3. RENDERIZAÇÃO DE COMPONENTES DINÂMICOS
 * 4. SISTEMA DE AGENDAMENTO COM PREVENÇÃO DE CONFLITOS DE HORÁRIO
 * 5. FLUXO DE PAGAMENTO VIA PIX COM CÓPIA RÁPIDA
 * 6. GERENCIAMENTO E CANCELAMENTO DE HORÁRIOS
 * 7. NOTIFICAÇÕES (TOASTS) E MODAIS
 */

// ============================================================================
// 1. ÁREA DE CONFIGURAÇÃO RÁPIDA (EDITE AQUI CONFORME SEU NEGÓCIO)
// ============================================================================

/**
 * [CONFIGURAÇÃO DO PIX]
 * Altere os dados abaixo para a chave Pix real da sua barbearia.
 */
const CONFIG_PIX = {
  habilitado: true,                          // Mude para false se não aceitar Pix
  chavePix: "contato@domnavalha.com.br",     // Sua chave Pix (Email, CPF, CNPJ, Celular ou Aleatória)
  beneficiario: "Dom Navalha Barbershop LTDA",
  cidade: "São Paulo"
};

/**
 * [CONFIGURAÇÃO DO EXPEDIENTE E DIAS DE FUNCIONAMENTO]
 * Configure o intervalo de atendimento e dias de folga.
 */
const CONFIG_EXPEDIENTE = {
  // Dias da semana: 0 = Domingo, 1 = Segunda, 2 = Terça, ..., 6 = Sábado
  diasFechados: [1], // Fechado às Segundas-feiras
  
  // Horários de terça a sábado (09:00 até 20:00)
  semana: {
    inicio: 9,  // 09:00
    fim: 20,    // 20:00 (último horário às 19:00 ou 19:30 dependendo do intervalo)
    intervaloMinutos: 45 // Duração de cada slot em minutos (ex: 30, 45 ou 60)
  },
  
  // Horários de domingo (09:00 até 14:00)
  domingo: {
    inicio: 9,
    fim: 14,
    intervaloMinutos: 45
  }
};

/**
 * [LISTA DE SERVIÇOS OFERECIDOS]
 * Adicione, remova ou edite preços e durações dos serviços.
 */
const SERVICOS_CATALOGO = [
  { id: "corte-social", nome: "Corte Tradicional / Degradê", preco: 50.00, duracao: "45 min", icone: "fa-scissors" },
  { id: "barba-terapia", nome: "Barba Terapia com Toalha Quente", preco: 45.00, duracao: "35 min", icone: "fa-spray-can" },
  { id: "combo-corte-barba", nome: "Combo Completo (Cabelo + Barba)", preco: 85.00, duracao: "1h 15min", icone: "fa-gem" },
  { id: "pezinho-sobrancelha", nome: "Acabamento / Pezinho + Sobrancelha", preco: 30.00, duracao: "25 min", icone: "fa-brush" },
  { id: "camuflagem-grisalhos", nome: "Camuflagem de Fios Brancos / Tonalização", preco: 60.00, duracao: "40 min", icone: "fa-wand-magic-sparkles" }
];

/**
 * [LISTA DE PROMOÇÕES VIGENTES]
 * Edite os dados abaixo para alterar as promoções exibidas no site.
 */
const PROMOCOES_VIGENTES = [
  {
    id: "promo-1",
    tag: "Terça e Quarta",
    titulo: "Dia do Cabelo & Barba",
    descricao: "Realize o corte tradicional e a barboterapia clássica com valor especial de início de semana.",
    desconto: "20% OFF",
    validade: "Válido até 30/11/2026",
    servicoIdSugerido: "combo-corte-barba"
  },
  {
    id: "promo-2",
    tag: "Pai e Filho",
    titulo: "Combo Duplo Família",
    descricao: "Traga seu filho ou seu pai no mesmo horário e ambos ganham acabamento completo com hidratação.",
    desconto: "15% OFF",
    validade: "Válido aos Sábados",
    servicoIdSugerido: "corte-social"
  },
  {
    id: "promo-3",
    tag: "Primeira Vez",
    titulo: "Boas-Vindas Dom Navalha",
    descricao: "Novo por aqui? Agende seu primeiro corte e ganhe uma cerveja artesanal ou café expresso grátis.",
    desconto: "Cerveja Free",
    validade: "Válido para novos clientes",
    servicoIdSugerido: "corte-social"
  }
];

/**
 * [LISTA DE PLANOS & ASSINATURAS VIP]
 * Edite os planos mensais, valores e benefícios.
 */
const PLANOS_ASSINATURA = [
  {
    id: "plano-silver",
    nome: "Plano Silver",
    tagline: "Para quem quer o corte sempre alinhado",
    preco: 99.90,
    periodo: "/mês",
    destaque: false,
    beneficios: [
      "2 Cortes por mês (qualquer estilo)",
      "1 Acabamento / Pezinho cortesia",
      "10% de desconto em pomadas e óleos",
      "Agendamento via WhatsApp prioritário"
    ]
  },
  {
    id: "plano-gold",
    nome: "Plano Gold VIP",
    tagline: "Nosso plano mais procurado por executivos",
    preco: 169.90,
    periodo: "/mês",
    destaque: true,
    beneficios: [
      "Cortes Ilimitados durante o mês",
      "2 Barboterapias completas com toalha quente",
      "1 Cerveja artesanal por visita",
      "15% de desconto na linha de cosméticos",
      "Atendimento exclusivo sem fila"
    ]
  },
  {
    id: "plano-black",
    nome: "Black Club & Spa",
    tagline: "A experiência máxima de cuidado pessoal",
    preco: 249.90,
    periodo: "/mês",
    destaque: false,
    beneficios: [
      "Cortes e Barba ILIMITADOS o mês todo",
      "Sobrancelha e higienização facial inclusas",
      "Open Bar de cervejas artesanais e cafés",
      "Passe livre para eventos exclusivos do clube",
      "Vaga de estacionamento cortesia"
    ]
  }
];

/**
 * [BARBEIROS INICIAIS (SEED DO LOCALSTORAGE)]
 * Usado apenas na primeira vez para demonstrar o sistema.
 * O usuário pode cadastrar novos barbeiros pelo próprio site!
 */
const BARBEIROS_INICIAIS = [
  {
    id: "barb-1",
    nome: "Mateus 'Navalha' Costa",
    especialidade: "Fade & Visagismo Moderno",
    bio: "Mais de 8 anos transformando estilos com precisão cirúrgica e degradês perfeitos.",
    avatar: "" // Vazio gerará iniciais estilizadas
  },
  {
    id: "barb-2",
    nome: "Rodrigo Toledo",
    especialidade: "Barboterapia Clássica & Bigode",
    bio: "Mestre no método tradicional de navalha italiana com toalha quente e óleos essenciais.",
    avatar: ""
  },
  {
    id: "barb-3",
    nome: "Carlos Eduardo (Cadu)",
    especialidade: "Cortes Clássicos & Tesoura",
    bio: "Especialista em penteados sociais, cortes executivos e finalizações com pomada matte.",
    avatar: ""
  }
];

// ============================================================================
// 2. GERENCIAMENTO DE ESTADO E LOCALSTORAGE
// ============================================================================

const STORAGE_KEYS = {
  BARBERS: "dom_navalha_barbers",
  APPOINTMENTS: "dom_navalha_appointments"
};

/**
 * Obtém a lista de barbeiros do localStorage ou inicializa com os dados padrão
 */
function obterBarbeiros() {
  const data = localStorage.getItem(STORAGE_KEYS.BARBERS);
  if (!data) {
    salvarBarbeiros(BARBEIROS_INICIAIS);
    return BARBEIROS_INICIAIS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Erro ao carregar barbeiros:", e);
    return BARBEIROS_INICIAIS;
  }
}

/**
 * Salva a lista de barbeiros no localStorage
 */
function salvarBarbeiros(barbeiros) {
  localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(barbeiros));
}

/**
 * Obtém os agendamentos cadastrados no localStorage
 */
function obterAgendamentos() {
  const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Erro ao ler agendamentos:", e);
    return [];
  }
}

/**
 * Salva a lista de agendamentos no localStorage
 */
function salvarAgendamentos(agendamentos) {
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(agendamentos));
}

// ============================================================================
// 3. UTILITÁRIOS E AUXILIARES
// ============================================================================

/**
 * Formata um valor numérico para a moeda brasileira (R$ 0,00)
 */
function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

/**
 * Obtém as iniciais de um nome (Ex: "Mateus Costa" -> "MC")
 */
function obterIniciais(nome) {
  if (!nome) return "BN";
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/**
 * Formata data no padrão DD/MM/AAAA a partir de YYYY-MM-DD
 */
function formatarDataBr(dataIso) {
  if (!dataIso) return "";
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/**
 * Dispara uma notificação flutuante (Toast)
 */
function mostrarToast(mensagem, tipo = "info", titulo = "") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  
  let icone = "fa-solid fa-circle-info";
  if (tipo === "success") icone = "fa-solid fa-circle-check";
  if (tipo === "error") icone = "fa-solid fa-triangle-exclamation";

  const tituloFinal = titulo || (tipo === "success" ? "Sucesso!" : tipo === "error" ? "Atenção" : "Informação");

  toast.innerHTML = `
    <i class="${icone}"></i>
    <div class="toast-content">
      <div class="toast-title">${tituloFinal}</div>
      <div class="toast-message">${mensagem}</div>
    </div>
    <button class="toast-close" aria-label="Fechar notificação">&times;</button>
  `;

  const btnClose = toast.querySelector(".toast-close");
  btnClose.addEventListener("click", () => {
    removerToast(toast);
  });

  container.appendChild(toast);

  // Auto-remove após 4.5 segundos
  setTimeout(() => {
    removerToast(toast);
  }, 4500);
}

function removerToast(toast) {
  toast.style.opacity = "0";
  toast.style.transform = "translateX(40px)";
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 300);
}

// ============================================================================
// 4. RENDERIZADORES DE TELA (HTML DINÂMICO)
// ============================================================================

/**
 * Renderiza as promoções na seção de promoções
 */
function renderizarPromocoes() {
  const container = document.getElementById("promotionsContainer");
  if (!container) return;

  container.innerHTML = PROMOCOES_VIGENTES.map(promo => `
    <div class="promo-card">
      <span class="promo-badge-discount">${promo.desconto}</span>
      <div>
        <span class="promo-tag">${promo.tag}</span>
        <h3 class="promo-title">${promo.titulo}</h3>
        <p class="promo-description">${promo.descricao}</p>
      </div>
      <div class="promo-footer">
        <span class="promo-validity">
          <i class="fa-regular fa-clock"></i> ${promo.validade}
        </span>
        <button class="btn btn-outline btn-sm btn-usar-promo" data-servico="${promo.servicoIdSugerido}">
          Aproveitar <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  `).join("");

  // Event listeners dos botões de promoção
  container.querySelectorAll(".btn-usar-promo").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const servicoId = e.currentTarget.getAttribute("data-servico");
      const selectServico = document.getElementById("bookingService");
      if (selectServico && servicoId) {
        selectServico.value = servicoId;
        atualizarResumo();
        document.getElementById("agendar").scrollIntoView({ behavior: "smooth" });
        mostrarToast("Promoção aplicada! Continue selecionando o barbeiro e data.", "info", "Promoção Selecionada");
      }
    });
  });
}

/**
 * Renderiza os planos VIP de assinatura
 */
function renderizarPlanos() {
  const container = document.getElementById("plansContainer");
  if (!container) return;

  container.innerHTML = PLANOS_ASSINATURA.map(plano => `
    <div class="plan-card ${plano.destaque ? 'featured' : ''}">
      ${plano.destaque ? '<div class="plan-ribbon"><i class="fa-solid fa-star"></i> Mais Escolhido</div>' : ''}
      <h3 class="plan-name">${plano.nome}</h3>
      <p class="plan-tagline">${plano.tagline}</p>

      <div class="plan-price-wrapper">
        <span class="currency">R$</span>
        <span class="amount">${plano.preco.toFixed(2).replace(".", ",")}</span>
        <span class="period">${plano.periodo}</span>
      </div>

      <ul class="plan-features-list">
        ${plano.beneficios.map(ben => `
          <li class="plan-feature-item">
            <i class="fa-solid fa-circle-check"></i>
            <span>${ben}</span>
          </li>
        `).join("")}
      </ul>

      <button class="btn ${plano.destaque ? 'btn-primary btn-glow' : 'btn-outline'} btn-block btn-contratar-plano" data-plano-id="${plano.id}">
        Contratar Este Plano
      </button>
    </div>
  `).join("");

  // Event listeners para contratar plano
  container.querySelectorAll(".btn-contratar-plano").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const planoId = e.currentTarget.getAttribute("data-plano-id");
      abrirModalPlano(planoId);
    });
  });
}

/**
 * Renderiza os cards dos barbeiros e atualiza o select no agendamento
 */
function renderizarBarbeiros() {
  const barbeiros = obterBarbeiros();
  const container = document.getElementById("barbersContainer");
  const selectBarbeiro = document.getElementById("bookingBarber");

  // 1. Renderiza os cards na seção da equipe
  if (container) {
    container.innerHTML = barbeiros.map(b => {
      const avatarHtml = b.avatar 
        ? `<img src="${b.avatar}" alt="Foto de ${b.nome}" class="barber-avatar-img">`
        : `<div class="barber-avatar-initials">${obterIniciais(b.nome)}</div>`;

      return `
        <div class="barber-card">
          <div class="barber-avatar-wrap">
            ${avatarHtml}
          </div>
          <h3 class="barber-name">${b.nome}</h3>
          <span class="barber-specialty">${b.especialidade}</span>
          <p class="barber-bio">${b.bio || "Profissional dedicado a oferecer o melhor atendimento e visual impecável."}</p>
          <button class="btn btn-outline btn-sm btn-block btn-agendar-com-barbeiro" data-barbeiro-id="${b.id}">
            <i class="fa-regular fa-calendar-check"></i> Agendar com ${b.nome.split(" ")[0]}
          </button>
        </div>
      `;
    }).join("");

    // Botões dos cards para já escolher no agendamento
    container.querySelectorAll(".btn-agendar-com-barbeiro").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const barbId = e.currentTarget.getAttribute("data-barbeiro-id");
        if (selectBarbeiro) {
          selectBarbeiro.value = barbId;
          atualizarResumo();
          carregarHorariosDisponiveis();
          document.getElementById("agendar").scrollIntoView({ behavior: "smooth" });
          mostrarToast("Barbeiro selecionado! Escolha a data desejada.", "info");
        }
      });
    });
  }

  // 2. Atualiza o dropdown no formulário de agendamento
  if (selectBarbeiro) {
    const valorAtual = selectBarbeiro.value;
    selectBarbeiro.innerHTML = `<option value="" disabled ${!valorAtual ? 'selected' : ''}>Selecione o profissional...</option>` +
      barbeiros.map(b => `<option value="${b.id}">${b.nome} (${b.especialidade})</option>`).join("");
    
    if (valorAtual) selectBarbeiro.value = valorAtual;
  }
}

/**
 * Popula o select de serviços no agendamento
 */
function popularSelectServicos() {
  const select = document.getElementById("bookingService");
  if (!select) return;

  select.innerHTML = `<option value="" disabled selected>Selecione um serviço...</option>` +
    SERVICOS_CATALOGO.map(s => `
      <option value="${s.id}" data-preco="${s.preco}" data-duracao="${s.duracao}">
        ${s.nome} - ${formatarMoeda(s.preco)} (${s.duracao})
      </option>
    `).join("");
}

// ============================================================================
// 5. CÁLCULO E PREVENÇÃO DE CONFLITO DE HORÁRIOS
// ============================================================================

/**
 * Gera os slots de horários com base no dia e filtra agendamentos já existentes
 */
function carregarHorariosDisponiveis() {
  const dateInput = document.getElementById("bookingDate");
  const barberSelect = document.getElementById("bookingBarber");
  const container = document.getElementById("timeSlotsContainer");
  const hiddenTimeInput = document.getElementById("selectedTime");

  if (!container) return;

  const dataEscolhida = dateInput ? dateInput.value : "";
  const barbeiroId = barberSelect ? barberSelect.value : "";

  // Limpa seleção atual
  hiddenTimeInput.value = "";
  document.getElementById("summaryTime").textContent = "--:--";

  if (!dataEscolhida || !barbeiroId) {
    container.innerHTML = `<p class="slots-placeholder">Selecione o barbeiro e a data para visualizar os horários livres.</p>`;
    return;
  }

  // Obter dia da semana da data escolhida (ajustando fuso horário local)
  const partesData = dataEscolhida.split("-");
  const dataObj = new Date(Number(partesData[0]), Number(partesData[1]) - 1, Number(partesData[2]));
  const diaSemana = dataObj.getDay();

  // Verifica se a barbearia abre neste dia
  if (CONFIG_EXPEDIENTE.diasFechados.includes(diaSemana)) {
    container.innerHTML = `
      <p class="slots-placeholder text-danger">
        <i class="fa-solid fa-ban"></i> Barbearia fechada às segundas-feiras. Por favor, escolha outra data.
      </p>
    `;
    return;
  }

  // Define a regra de expediente do dia
  const configDia = (diaSemana === 0) ? CONFIG_EXPEDIENTE.domingo : CONFIG_EXPEDIENTE.semana;
  const horaInicio = configDia.inicio;
  const horaFim = configDia.fim;
  const intervalo = configDia.intervaloMinutos;

  // Gerar array de horários
  const todosHorarios = [];
  let minutoAtual = horaInicio * 60;
  const minutoFim = horaFim * 60;

  while (minutoAtual + intervalo <= minutoFim) {
    const h = Math.floor(minutoAtual / 60);
    const m = minutoAtual % 60;
    const strHora = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    todosHorarios.push(strHora);
    minutoAtual += intervalo;
  }

  // Obter agendamentos já confirmados para esse barbeiro e essa data
  const agendamentosExistentes = obterAgendamentos().filter(app => {
    return app.barbeiroId === barbeiroId && 
           app.data === dataEscolhida && 
           app.status !== "Cancelado";
  });

  const horariosOcupados = agendamentosExistentes.map(app => app.horario);

  // Verificar se a data escolhida é HOJE para não exibir horários que já passaram
  const agora = new Date();
  const hojeAno = agora.getFullYear();
  const hojeMes = String(agora.getMonth() + 1).padStart(2, "0");
  const hojeDia = String(agora.getDate()).padStart(2, "0");
  const dataHojeStr = `${hojeAno}-${hojeMes}-${hojeDia}`;
  const minutoAgora = (agora.getHours() * 60) + agora.getMinutes();

  const ehHoje = (dataEscolhida === dataHojeStr);

  // Montar botões de slots
  container.innerHTML = "";

  todosHorarios.forEach(horario => {
    const [h, m] = horario.split(":").map(Number);
    const minutoSlot = (h * 60) + m;

    const slotJaPassou = ehHoje && (minutoSlot <= minutoAgora);
    const estaOcupado = horariosOcupados.includes(horario);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot-btn";
    btn.textContent = horario;

    if (slotJaPassou) {
      btn.disabled = true;
      btn.classList.add("booked");
      btn.title = "Horário já ultrapassado para o dia de hoje";
    } else if (estaOcupado) {
      btn.disabled = true;
      btn.classList.add("booked");
      btn.title = "Horário já reservado com este barbeiro";
    } else {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        hiddenTimeInput.value = horario;
        document.getElementById("summaryTime").textContent = horario;
      });
    }

    container.appendChild(btn);
  });

  // Caso todos estejam ocupados ou passados
  const slotsLivres = container.querySelectorAll(".slot-btn:not(:disabled)");
  if (slotsLivres.length === 0) {
    container.innerHTML = `
      <p class="slots-placeholder text-danger">
        <i class="fa-regular fa-calendar-xmark"></i> Todos os horários deste barbeiro para a data escolhida estão lotados. Tente outro barbeiro ou dia.
      </p>
    `;
  }
}

/**
 * Atualiza os valores do resumo lateral do agendamento
 */
function atualizarResumo() {
  const serviceSelect = document.getElementById("bookingService");
  const barberSelect = document.getElementById("bookingBarber");
  const dateInput = document.getElementById("bookingDate");
  const selectedTime = document.getElementById("selectedTime").value;

  const summaryService = document.getElementById("summaryService");
  const summaryDuration = document.getElementById("summaryDuration");
  const summaryBarber = document.getElementById("summaryBarber");
  const summaryDate = document.getElementById("summaryDate");
  const summaryPrice = document.getElementById("summaryPrice");

  // Serviço
  if (serviceSelect && serviceSelect.selectedIndex > 0) {
    const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
    const preco = parseFloat(selectedOption.getAttribute("data-preco")) || 0;
    const duracao = selectedOption.getAttribute("data-duracao") || "--";
    const nomeLimpo = selectedOption.textContent.split("-")[0].trim();

    summaryService.textContent = nomeLimpo;
    summaryDuration.textContent = duracao;
    summaryPrice.textContent = formatarMoeda(preco);
  } else {
    summaryService.textContent = "Nenhum selecionado";
    summaryDuration.textContent = "--";
    summaryPrice.textContent = "R$ 0,00";
  }

  // Barbeiro
  if (barberSelect && barberSelect.selectedIndex > 0) {
    const nomeBarbeiro = barberSelect.options[barberSelect.selectedIndex].textContent.split("(")[0].trim();
    summaryBarber.textContent = nomeBarbeiro;
  } else {
    summaryBarber.textContent = "A escolher";
  }

  // Data
  if (dateInput && dateInput.value) {
    summaryDate.textContent = formatarDataBr(dateInput.value);
  } else {
    summaryDate.textContent = "--/--/----";
  }
}

// ============================================================================
// 6. PROCESSAMENTO DE AGENDAMENTO & PAGAMENTO PIX
// ============================================================================

/**
 * Manipula a submissão do formulário de agendamento com validação completa
 */
function processarAgendamento(e) {
  e.preventDefault();

  const serviceSelect = document.getElementById("bookingService");
  const barberSelect = document.getElementById("bookingBarber");
  const dateInput = document.getElementById("bookingDate");
  const selectedTimeInput = document.getElementById("selectedTime");
  const clientNameInput = document.getElementById("clientName");
  const clientPhoneInput = document.getElementById("clientPhone");
  const paymentMethodInput = document.querySelector('input[name="paymentMethod"]:checked');

  // Validações básicas
  if (!serviceSelect.value) {
    mostrarToast("Por favor, selecione o serviço desejado.", "error");
    serviceSelect.focus();
    return;
  }
  if (!barberSelect.value) {
    mostrarToast("Por favor, selecione o barbeiro de sua preferência.", "error");
    barberSelect.focus();
    return;
  }
  if (!dateInput.value) {
    mostrarToast("Por favor, selecione uma data válida para o agendamento.", "error");
    dateInput.focus();
    return;
  }
  if (!selectedTimeInput.value) {
    mostrarToast("Por favor, clique em um dos horários livres disponíveis.", "error");
    return;
  }
  if (!clientNameInput.value.trim() || clientNameInput.value.trim().length < 3) {
    mostrarToast("Informe seu nome completo (mínimo 3 letras).", "error");
    clientNameInput.focus();
    return;
  }
  if (!clientPhoneInput.value.trim() || clientPhoneInput.value.trim().length < 8) {
    mostrarToast("Informe um número de telefone / WhatsApp válido.", "error");
    clientPhoneInput.focus();
    return;
  }

  // Verificação de data passada
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const partesData = dateInput.value.split("-");
  const dataEscolhida = new Date(Number(partesData[0]), Number(partesData[1]) - 1, Number(partesData[2]));

  if (dataEscolhida < hoje) {
    mostrarToast("Não é possível agendar em datas passadas. Escolha uma data futura.", "error");
    dateInput.focus();
    return;
  }

  // Prevenção final contra conflito (caso alguém tenha agendado simultaneamente)
  const agendamentosAtuais = obterAgendamentos();
  const conflito = agendamentosAtuais.find(app => {
    return app.barbeiroId === barberSelect.value &&
           app.data === dateInput.value &&
           app.horario === selectedTimeInput.value &&
           app.status !== "Cancelado";
  });

  if (conflito) {
    mostrarToast("Desculpe! Este horário acabou de ser reservado. Por favor, selecione outro horário.", "error");
    carregarHorariosDisponiveis();
    return;
  }

  // Obter detalhes do serviço e barbeiro
  const servicoObj = SERVICOS_CATALOGO.find(s => s.id === serviceSelect.value);
  const barbeiros = obterBarbeiros();
  const barbeiroObj = barbeiros.find(b => b.id === barberSelect.value);

  const novoAgendamento = {
    id: "app-" + Date.now(),
    servicoId: servicoObj.id,
    servicoNome: servicoObj.nome,
    preco: servicoObj.preco,
    duracao: servicoObj.duracao,
    barbeiroId: barbeiroObj.id,
    barbeiroNome: barbeiroObj.nome,
    data: dateInput.value,
    horario: selectedTimeInput.value,
    clienteNome: clientNameInput.value.trim(),
    clienteTelefone: clientPhoneInput.value.trim(),
    metodoPagamento: paymentMethodInput ? paymentMethodInput.value : "PIX",
    status: "Confirmado",
    criadoEm: new Date().toISOString()
  };

  // Salvar no localStorage
  agendamentosAtuais.push(novoAgendamento);
  salvarAgendamentos(agendamentosAtuais);

  // Se escolheu Pix e Pix estiver ativo, abrir Modal Pix
  if (novoAgendamento.metodoPagamento === "PIX" && CONFIG_PIX.habilitado) {
    abrirModalPix(novoAgendamento);
  } else {
    mostrarToast(`Agendamento confirmado para ${formatarDataBr(novoAgendamento.data)} às ${novoAgendamento.horario}!`, "success", "Horário Reservado!");
  }

  // Resetar formulário e atualizar listas
  document.getElementById("bookingForm").reset();
  document.getElementById("selectedTime").value = "";
  atualizarResumo();
  carregarHorariosDisponiveis();
  renderizarMeusAgendamentos();

  // Scroll suave para os agendamentos se não abriu Pix
  if (novoAgendamento.metodoPagamento !== "PIX") {
    document.getElementById("meus-agendamentos").scrollIntoView({ behavior: "smooth" });
  }
}

/**
 * Abre o Modal com os dados para pagamento Pix
 */
function abrirModalPix(agendamento) {
  const modal = document.getElementById("pixPaymentModal");
  if (!modal) return;

  document.getElementById("pixModalAmount").textContent = formatarMoeda(agendamento.preco);
  document.getElementById("pixModalAmountInst").textContent = formatarMoeda(agendamento.preco);
  document.getElementById("pixModalServiceDesc").textContent = `${agendamento.servicoNome} com ${agendamento.barbeiroNome}`;
  document.getElementById("pixKeyInput").value = CONFIG_PIX.chavePix;
  document.getElementById("pixCopyFeedback").textContent = "";

  modal.hidden = false;
}

/**
 * Copia a chave Pix para a área de transferência do dispositivo
 */
function copiarChavePix() {
  const input = document.getElementById("pixKeyInput");
  const feedback = document.getElementById("pixCopyFeedback");

  if (!input) return;

  navigator.clipboard.writeText(input.value).then(() => {
    feedback.textContent = "✓ Chave Pix copiada para a área de transferência!";
    mostrarToast("Chave Pix copiada com sucesso!", "success");
    setTimeout(() => {
      feedback.textContent = "";
    }, 4000);
  }).catch(() => {
    // Fallback para navegadores sem suporte direto ao clipboard
    input.select();
    document.execCommand("copy");
    feedback.textContent = "✓ Chave copiada!";
    mostrarToast("Chave Pix copiada!", "success");
  });
}

// ============================================================================
// 7. GESTÃO E CANCELAMENTO DE AGENDAMENTOS
// ============================================================================

/**
 * Renderiza a lista de agendamentos do usuário e botão de cancelamento
 */
function renderizarMeusAgendamentos() {
  const container = document.getElementById("appointmentsContainer");
  if (!container) return;

  const agendamentos = obterAgendamentos();

  if (agendamentos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-calendar-xmark empty-state-icon"></i>
        <h3>Nenhum agendamento realizado ainda</h3>
        <p>Você ainda não reservou nenhum horário. Escolha seu barbeiro e garanta seu atendimento agora mesmo!</p>
        <a href="#agendar" class="btn btn-primary btn-sm btn-glow">Fazer Meu Primeiro Agendamento</a>
      </div>
    `;
    return;
  }

  // Ordenar agendamentos: mais recentes ou próximos primeiro
  const ordenados = [...agendamentos].sort((a, b) => {
    return (b.data + b.horario).localeCompare(a.data + a.horario);
  });

  const mesesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  container.innerHTML = ordenados.map(app => {
    const partes = app.data.split("-");
    const dia = partes[2];
    const mes = mesesAbrev[parseInt(partes[1], 10) - 1] || "Mês";

    const isCancelado = app.status === "Cancelado";
    const statusBadge = isCancelado 
      ? `<span class="badge" style="background: var(--color-danger-bg); color: var(--color-danger);">Cancelado</span>`
      : `<span class="badge badge-success">Confirmado</span>`;

    const btnCancelar = !isCancelado 
      ? `<button class="btn btn-danger-outline btn-sm btn-cancelar-app" data-id="${app.id}">
           <i class="fa-solid fa-ban"></i> Cancelar
         </button>`
      : `<span class="text-muted small">Horário liberado</span>`;

    return `
      <div class="appointment-item-card" style="${isCancelado ? 'opacity: 0.65;' : ''}">
        <div class="app-info-group">
          <div class="app-date-box">
            <span class="app-date-day">${dia}</span>
            <span class="app-date-month">${mes}</span>
          </div>
          <div class="app-details">
            <h4>${app.servicoNome} ${statusBadge}</h4>
            <div class="app-meta">
              <span><i class="fa-solid fa-user-tie text-gold"></i> ${app.barbeiroNome}</span>
              <span><i class="fa-regular fa-clock text-gold"></i> ${app.horario} (${app.duracao})</span>
              <span><i class="fa-solid fa-tag text-gold"></i> ${formatarMoeda(app.preco)}</span>
              <span><i class="fa-solid fa-user text-gold"></i> ${app.clienteNome}</span>
            </div>
          </div>
        </div>

        <div class="app-actions">
          ${btnCancelar}
        </div>
      </div>
    `;
  }).join("");

  // Event listeners para botões de cancelamento
  container.querySelectorAll(".btn-cancelar-app").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      cancelarAgendamento(id);
    });
  });
}

/**
 * Cancela um agendamento existente e libera o horário no sistema
 */
function cancelarAgendamento(id) {
  const confirmacao = window.confirm("Tem certeza que deseja cancelar este agendamento? O horário ficará livre novamente para outros clientes.");
  if (!confirmacao) return;

  const agendamentos = obterAgendamentos();
  const index = agendamentos.findIndex(app => app.id === id);

  if (index !== -1) {
    agendamentos[index].status = "Cancelado";
    salvarAgendamentos(agendamentos);
    mostrarToast("Agendamento cancelado com sucesso. O horário foi liberado no sistema.", "info", "Cancelamento Concluído");
    renderizarMeusAgendamentos();
    carregarHorariosDisponiveis(); // Atualiza a grade caso o usuário esteja com a mesma data aberta
  }
}

// ============================================================================
// 8. CADASTRO DE NOVO BARBEIRO
// ============================================================================

/**
 * Processa a inclusão de um novo barbeiro via modal
 */
function processarNovoBarbeiro(e) {
  e.preventDefault();

  const nameInput = document.getElementById("barberName");
  const specInput = document.getElementById("barberSpecialty");
  const bioInput = document.getElementById("barberBio");
  const avatarInput = document.getElementById("barberAvatar");

  const nome = nameInput.value.trim();
  const especialidade = specInput.value.trim();
  const bio = bioInput.value.trim();
  const avatar = avatarInput.value.trim();

  if (!nome || nome.length < 3) {
    mostrarToast("O nome do barbeiro deve ter pelo menos 3 caracteres.", "error");
    nameInput.focus();
    return;
  }
  if (!especialidade) {
    mostrarToast("Informe a especialidade principal do profissional.", "error");
    specInput.focus();
    return;
  }

  const barbeiros = obterBarbeiros();
  const novoBarbeiro = {
    id: "barb-" + Date.now(),
    nome: nome,
    especialidade: especialidade,
    bio: bio || `Especialista em ${especialidade} com técnica refinada e atendimento personalizado.`,
    avatar: avatar || ""
  };

  barbeiros.push(novoBarbeiro);
  salvarBarbeiros(barbeiros);

  // Atualizar visualização e dropdown
  renderizarBarbeiros();

  // Fechar modal e resetar
  document.getElementById("barberModal").hidden = true;
  document.getElementById("newBarberForm").reset();

  mostrarToast(`Barbeiro ${novoBarbeiro.nome} cadastrado com sucesso!`, "success", "Barbeiro Adicionado");
}

// ============================================================================
// 9. CONTRATAÇÃO DE PLANOS VIP
// ============================================================================

function abrirModalPlano(planoId) {
  const plano = PLANOS_ASSINATURA.find(p => p.id === planoId);
  if (!plano) return;

  const modal = document.getElementById("planModal");
  const summaryBox = document.getElementById("planSelectedSummary");

  if (!modal || !summaryBox) return;

  summaryBox.innerHTML = `
    <h4 style="font-family: var(--font-heading); color: var(--gold-light); margin-bottom: 0.4rem;">
      <i class="fa-solid fa-gem"></i> ${plano.nome}
    </h4>
    <p style="font-size: 0.9rem; color: #fff; margin-bottom: 0.5rem;">${plano.tagline}</p>
    <div style="font-size: 1.4rem; font-weight: 800; color: #fff;">
      R$ ${plano.preco.toFixed(2).replace(".", ",")} <span style="font-size: 0.85rem; font-weight: normal; color: var(--text-secondary);">${plano.periodo}</span>
    </div>
  `;

  modal.hidden = false;
}

function processarAdesaoPlano(e) {
  e.preventDefault();
  const name = document.getElementById("planClientName").value.trim();
  const phone = document.getElementById("planClientPhone").value.trim();

  if (!name || !phone) {
    mostrarToast("Por favor, preencha todos os campos obrigatórios.", "error");
    return;
  }

  document.getElementById("planModal").hidden = true;
  document.getElementById("planHireForm").reset();

  mostrarToast(`Obrigado, ${name}! Recebemos seu pedido de assinatura. Nossa equipe entrará em contato via WhatsApp no número ${phone}.`, "success", "Assinatura Solicitada!");
}

// ============================================================================
// 10. INICIALIZAÇÃO E EVENT LISTENERS
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. Renderizar seções dinâmicas
  renderizarPromocoes();
  renderizarPlanos();
  renderizarBarbeiros();
  popularSelectServicos();
  renderizarMeusAgendamentos();

  // 2. Configurar restrição de data mínima para hoje no datepicker
  const dateInput = document.getElementById("bookingDate");
  if (dateInput) {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    dateInput.min = `${ano}-${mes}-${dia}`;
    
    // Ouvir alterações na data para atualizar horários disponíveis
    dateInput.addEventListener("change", () => {
      atualizarResumo();
      carregarHorariosDisponiveis();
    });
  }

  // 3. Ouvir alterações no select de serviço e barbeiro
  const serviceSelect = document.getElementById("bookingService");
  if (serviceSelect) {
    serviceSelect.addEventListener("change", () => {
      atualizarResumo();
    });
  }

  const barberSelect = document.getElementById("bookingBarber");
  if (barberSelect) {
    barberSelect.addEventListener("change", () => {
      atualizarResumo();
      carregarHorariosDisponiveis();
    });
  }

  // 4. Submissão do formulário de agendamento
  const bookingForm = document.getElementById("bookingForm");
  if (bookingForm) {
    bookingForm.addEventListener("submit", processarAgendamento);
  }

  // 5. Botões e Modais de Barbeiro
  const btnOpenBarberModal = document.getElementById("btnOpenNewBarberModal");
  const barberModal = document.getElementById("barberModal");
  const btnCloseBarberModal = document.getElementById("btnCloseBarberModal");
  const btnCancelBarberModal = document.getElementById("btnCancelBarberModal");
  const newBarberForm = document.getElementById("newBarberForm");

  if (btnOpenBarberModal && barberModal) {
    btnOpenBarberModal.addEventListener("click", () => {
      barberModal.hidden = false;
    });
  }

  if (btnCloseBarberModal && barberModal) {
    btnCloseBarberModal.addEventListener("click", () => {
      barberModal.hidden = true;
    });
  }

  if (btnCancelBarberModal && barberModal) {
    btnCancelBarberModal.addEventListener("click", () => {
      barberModal.hidden = true;
    });
  }

  if (newBarberForm) {
    newBarberForm.addEventListener("submit", processarNovoBarbeiro);
  }

  // 6. Botões e Modais de Pix
  const pixModal = document.getElementById("pixPaymentModal");
  const btnClosePixModal = document.getElementById("btnClosePixModal");
  const btnFinishPixModal = document.getElementById("btnFinishPixModal");
  const btnCopyPix = document.getElementById("btnCopyPix");

  if (btnClosePixModal && pixModal) {
    btnClosePixModal.addEventListener("click", () => {
      pixModal.hidden = true;
    });
  }

  if (btnFinishPixModal && pixModal) {
    btnFinishPixModal.addEventListener("click", () => {
      pixModal.hidden = true;
      document.getElementById("meus-agendamentos").scrollIntoView({ behavior: "smooth" });
    });
  }

  if (btnCopyPix) {
    btnCopyPix.addEventListener("click", copiarChavePix);
  }

  // 7. Modal de Contratação de Planos
  const planModal = document.getElementById("planModal");
  const btnClosePlanModal = document.getElementById("btnClosePlanModal");
  const btnCancelPlanModal = document.getElementById("btnCancelPlanModal");
  const planHireForm = document.getElementById("planHireForm");

  if (btnClosePlanModal && planModal) {
    btnClosePlanModal.addEventListener("click", () => {
      planModal.hidden = true;
    });
  }

  if (btnCancelPlanModal && planModal) {
    btnCancelPlanModal.addEventListener("click", () => {
      planModal.hidden = true;
    });
  }

  if (planHireForm) {
    planHireForm.addEventListener("submit", processarAdesaoPlano);
  }

  // Fechar qualquer modal clicando fora do diálogo
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      e.target.hidden = true;
    }
  });

  // Fechar modais ao pressionar tecla ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay").forEach(modal => {
        modal.hidden = true;
      });
    }
  });

  // 8. Atualizar lista de agendamentos manual
  const btnRefresh = document.getElementById("btnRefreshAppointments");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      renderizarMeusAgendamentos();
      mostrarToast("Lista de agendamentos sincronizada!", "info");
    });
  }

  // 9. Opções de Pagamento (Toggle Radio Visual)
  const payPixRadio = document.getElementById("payPix");
  const payInShopRadio = document.getElementById("payInShop");
  const pixOptionBox = document.getElementById("payWithPixOption");
  const inShopOptionBox = document.getElementById("payInShopOption");

  function atualizarOpcoesPagamento() {
    if (payPixRadio && payPixRadio.checked) {
      pixOptionBox.classList.add("active");
      inShopOptionBox.classList.remove("active");
    } else if (inShopOptionBox) {
      pixOptionBox.classList.remove("active");
      inShopOptionBox.classList.add("active");
    }
  }

  if (payPixRadio && payInShopRadio) {
    payPixRadio.addEventListener("change", atualizarOpcoesPagamento);
    payInShopRadio.addEventListener("change", atualizarOpcoesPagamento);
    pixOptionBox.addEventListener("click", () => {
      payPixRadio.checked = true;
      atualizarOpcoesPagamento();
    });
    inShopOptionBox.addEventListener("click", () => {
      payInShopRadio.checked = true;
      atualizarOpcoesPagamento();
    });
  }

  // 10. Menu Mobile Toggle
  const mobileToggle = document.getElementById("mobileToggle");
  const mainNav = document.getElementById("mainNav");

  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener("click", () => {
      mainNav.classList.toggle("open");
      const isExpanded = mainNav.classList.contains("open");
      mobileToggle.setAttribute("aria-expanded", isExpanded);
    });

    // Fechar menu mobile ao clicar em um link
    mainNav.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        mobileToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // 11. Destacar link ativo conforme scroll
  const sections = document.querySelectorAll("section[id]");
  window.addEventListener("scroll", () => {
    const scrollY = window.pageYOffset;
    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      const sectionId = section.getAttribute("id");
      const navLink = document.querySelector(`.main-nav a[href*="${sectionId}"]`);

      if (navLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          document.querySelectorAll(".main-nav a").forEach(l => l.classList.remove("active"));
          navLink.classList.add("active");
        }
      }
    });
  });
});
