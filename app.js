(function () {
  "use strict";

  const STORAGE_KEY = "oficina_veiculos_v1";
  const STATUS_LABEL = {
    pendente: "Pendente",
    andamento: "Em andamento",
    concluido: "Concluído",
  };

  // Elementos
  const form = document.getElementById("veiculoForm");
  const formTitle = document.getElementById("formTitle");
  const btnSalvar = document.getElementById("btnSalvar");
  const btnCancelar = document.getElementById("btnCancelar");
  const lista = document.getElementById("lista");
  const busca = document.getElementById("busca");
  const filtroStatus = document.getElementById("filtroStatus");

  const campos = {
    id: document.getElementById("veiculoId"),
    marca: document.getElementById("marca"),
    modelo: document.getElementById("modelo"),
    ano: document.getElementById("ano"),
    cor: document.getElementById("cor"),
    placa: document.getElementById("placa"),
    quilometragem: document.getElementById("quilometragem"),
    dono: document.getElementById("dono"),
    servicoRealizado: document.getElementById("servicoRealizado"),
    valorServico: document.getElementById("valorServico"),
    precisaFazer: document.getElementById("precisaFazer"),
    status: document.getElementById("status"),
  };

  const ordemImpressao = document.getElementById("ordemImpressao");

  let veiculos = carregar();

  // ---------- Persistência ----------
  function carregar() {
    try {
      const dados = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(dados) ? dados : [];
    } catch (e) {
      return [];
    }
  }

  function salvar() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(veiculos));
    } catch (e) {
      alert("Não foi possível salvar os dados neste navegador.");
    }
  }

  function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- Validação ----------
  function setErro(campo, mensagem) {
    const el = document.getElementById("erro-" + campo);
    if (el) el.textContent = mensagem;
    campos[campo].classList.toggle("invalid", Boolean(mensagem));
  }

  function validar() {
    const anoMax = new Date().getFullYear() + 1;
    let ok = true;

    ["marca", "modelo", "cor", "placa", "dono"].forEach(function (c) {
      if (!campos[c].value.trim()) {
        setErro(c, "Campo obrigatório.");
        ok = false;
      } else {
        setErro(c, "");
      }
    });

    const ano = Number(campos.ano.value);
    if (!campos.ano.value || !Number.isInteger(ano) || ano < 1900 || ano > anoMax) {
      setErro("ano", "Informe um ano entre 1900 e " + anoMax + ".");
      ok = false;
    } else {
      setErro("ano", "");
    }

    const quilometragem = Number(campos.quilometragem.value);
    if (!campos.quilometragem.value || !Number.isInteger(quilometragem) || quilometragem < 0) {
      setErro("quilometragem", "Informe uma quilometragem válida.");
      ok = false;
    } else {
      setErro("quilometragem", "");
    }

    const valorServico = Number(campos.valorServico.value);
    if (!campos.valorServico.value || !Number.isFinite(valorServico) || valorServico < 0) {
      setErro("valorServico", "Informe um valor válido.");
      ok = false;
    } else {
      setErro("valorServico", "");
    }

    return ok;
  }

  // ---------- Formulário ----------
  function limparFormulario() {
    form.reset();
    campos.id.value = "";
    Object.keys(campos).forEach(function (c) {
      if (document.getElementById("erro-" + c)) setErro(c, "");
    });
    formTitle.textContent = "Cadastrar veículo";
    btnSalvar.textContent = "Salvar veículo";
    btnCancelar.hidden = true;
  }

  function editar(id) {
    const v = veiculos.find(function (x) { return x.id === id; });
    if (!v) return;

    campos.id.value = v.id;
    campos.marca.value = v.marca;
    campos.modelo.value = v.modelo;
    campos.ano.value = v.ano;
    campos.cor.value = v.cor;
    campos.placa.value = v.placa || "";
    campos.quilometragem.value = v.quilometragem === undefined ? "" : v.quilometragem;
    campos.dono.value = v.dono;
    campos.servicoRealizado.value = v.servicoRealizado;
    campos.valorServico.value = v.valorServico === undefined ? "" : v.valorServico;
    campos.precisaFazer.value = v.precisaFazer;
    campos.status.value = v.status;

    formTitle.textContent = "Editar veículo";
    btnSalvar.textContent = "Atualizar veículo";
    btnCancelar.hidden = false;
    campos.marca.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validar()) return;

    const dados = {
      marca: campos.marca.value.trim(),
      modelo: campos.modelo.value.trim(),
      ano: Number(campos.ano.value),
      cor: campos.cor.value.trim(),
      placa: campos.placa.value.trim().toUpperCase(),
      quilometragem: Number(campos.quilometragem.value),
      dono: campos.dono.value.trim(),
      servicoRealizado: campos.servicoRealizado.value.trim(),
      valorServico: Number(campos.valorServico.value),
      precisaFazer: campos.precisaFazer.value.trim(),
      status: campos.status.value,
    };

    if (campos.id.value) {
      veiculos = veiculos.map(function (v) {
        return v.id === campos.id.value ? Object.assign({}, v, dados) : v;
      });
    } else {
      veiculos.unshift(Object.assign({ id: gerarId(), criadoEm: new Date().toISOString() }, dados));
    }

    salvar();
    limparFormulario();
    renderizar();
  });

  btnCancelar.addEventListener("click", limparFormulario);

  // ---------- Ações ----------
  function remover(id) {
    const v = veiculos.find(function (x) { return x.id === id; });
    if (!v) return;
    if (!confirm("Excluir o veículo " + v.marca + " " + v.modelo + " de " + v.dono + "?")) return;

    veiculos = veiculos.filter(function (x) { return x.id !== id; });
    if (campos.id.value === id) limparFormulario();
    salvar();
    renderizar();
  }

  function mudarStatus(id, status) {
    veiculos = veiculos.map(function (v) {
      return v.id === id ? Object.assign({}, v, { status: status }) : v;
    });
    salvar();
    renderizar();
  }

  // ---------- Renderização ----------
  function el(tag, classe, texto) {
    const n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto !== undefined) n.textContent = texto;
    return n;
  }

  function chip(rotulo, valor) {
    const c = el("span", "chip");
    c.appendChild(document.createTextNode(rotulo + ": "));
    c.appendChild(el("strong", "", String(valor)));
    return c;
  }

  function bloco(titulo, texto) {
    const b = el("div", "info");
    b.appendChild(el("h3", "", titulo));
    const p = el("p", texto ? "" : "empty", texto || "Nada informado");
    b.appendChild(p);
    return b;
  }

  function botao(rotulo, classe, onClick) {
    const b = el("button", "btn small " + classe, rotulo);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  function imprimirOrdem(id) {
    const v = veiculos.find(function (x) { return x.id === id; });
    if (!v) return;

    ordemImpressao.textContent = "";
    ordemImpressao.setAttribute("aria-hidden", "false");

    const titulo = el("h1", "", "Ordem de Serviço");
    ordemImpressao.appendChild(titulo);
    ordemImpressao.appendChild(el("p", "ordem-numero", "OS " + v.id));

    const dadosVeiculo = el("section", "ordem-secao");
    dadosVeiculo.appendChild(el("h2", "", "Dados do veículo e proprietário"));
    const veiculoGrid = el("div", "ordem-grid");
    [
      ["Proprietário", v.dono],
      ["Veículo", v.marca + " " + v.modelo],
      ["Ano", v.ano],
      ["Cor", v.cor],
      ["Placa", v.placa || "Não informada"],
      ["Quilometragem", v.quilometragem === undefined ? "Não informada" : Number(v.quilometragem).toLocaleString("pt-BR") + " km"],
    ].forEach(function (item) {
      const campo = el("div", "ordem-campo");
      campo.appendChild(el("strong", "", item[0]));
      campo.appendChild(el("span", "", String(item[1])));
      veiculoGrid.appendChild(campo);
    });
    dadosVeiculo.appendChild(veiculoGrid);
    ordemImpressao.appendChild(dadosVeiculo);

    const dadosServico = el("section", "ordem-secao");
    dadosServico.appendChild(el("h2", "", "Serviço"));
    dadosServico.appendChild(bloco("Serviço realizado", v.servicoRealizado));
    dadosServico.appendChild(bloco("Serviço solicitado", v.precisaFazer));
    dadosServico.appendChild(el("p", "ordem-valor", "Valor do serviço: " + (
      v.valorServico === undefined
        ? "Não informado"
        : Number(v.valorServico).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    )));
    dadosServico.appendChild(el("p", "", "Status: " + (STATUS_LABEL[v.status] || v.status)));
    ordemImpressao.appendChild(dadosServico);

    const assinaturas = el("div", "ordem-assinaturas");
    assinaturas.appendChild(el("p", "", "____________________________________\nAssinatura do cliente"));
    assinaturas.appendChild(el("p", "", "____________________________________\nAssinatura do responsável"));
    ordemImpressao.appendChild(assinaturas);

    window.print();
  }

  window.addEventListener("afterprint", function () {
    ordemImpressao.setAttribute("aria-hidden", "true");
  });

  function criarCard(v) {
    const card = el("article", "vehicle " + v.status);

    const head = el("div", "vehicle-head");
    const titulos = el("div");
    titulos.appendChild(el("div", "vehicle-title", v.marca + " " + v.modelo));
    titulos.appendChild(el("div", "vehicle-owner", "Dono: " + v.dono));
    head.appendChild(titulos);
    head.appendChild(el("span", "badge " + v.status, STATUS_LABEL[v.status] || v.status));
    card.appendChild(head);

    const chips = el("div", "chips");
    chips.appendChild(chip("Marca", v.marca));
    chips.appendChild(chip("Modelo", v.modelo));
    chips.appendChild(chip("Ano", v.ano));
    chips.appendChild(chip("Cor", v.cor));
    chips.appendChild(chip("Placa", v.placa || "Não informada"));
    chips.appendChild(chip("Quilometragem", v.quilometragem === undefined ? "Não informada" : Number(v.quilometragem).toLocaleString("pt-BR") + " km"));
    chips.appendChild(chip("Valor do serviço", v.valorServico === undefined
      ? "Não informado"
      : Number(v.valorServico).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })));
    card.appendChild(chips);

    card.appendChild(bloco("Serviço realizado", v.servicoRealizado));
    card.appendChild(bloco("O que precisa fazer", v.precisaFazer));

    const acoes = el("div", "vehicle-actions");
    acoes.appendChild(botao("Imprimir ordem", "ghost", function () { imprimirOrdem(v.id); }));
    acoes.appendChild(botao("Editar", "ghost", function () { editar(v.id); }));
    if (v.status === "pendente") {
      acoes.appendChild(botao("Iniciar serviço", "ghost", function () { mudarStatus(v.id, "andamento"); }));
    }
    if (v.status !== "concluido") {
      acoes.appendChild(botao("Marcar concluído", "ghost", function () { mudarStatus(v.id, "concluido"); }));
    } else {
      acoes.appendChild(botao("Reabrir", "ghost", function () { mudarStatus(v.id, "pendente"); }));
    }
    acoes.appendChild(botao("Excluir", "danger", function () { remover(v.id); }));
    card.appendChild(acoes);

    return card;
  }

  function normalizar(texto) {
    return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function filtrados() {
    const termo = normalizar(busca.value.trim());
    const status = filtroStatus.value;

    return veiculos.filter(function (v) {
      if (status !== "todos" && v.status !== status) return false;
      if (!termo) return true;
      const alvo = normalizar(
        [v.marca, v.modelo, v.ano, v.cor, v.placa, v.quilometragem, v.valorServico, v.dono, v.servicoRealizado, v.precisaFazer].join(" ")
      );
      return alvo.indexOf(termo) !== -1;
    });
  }

  function atualizarEstatisticas() {
    document.getElementById("statTotal").textContent = veiculos.length;
    document.getElementById("statPendentes").textContent = veiculos.filter(function (v) {
      return v.status !== "concluido";
    }).length;
    document.getElementById("statConcluidos").textContent = veiculos.filter(function (v) {
      return v.status === "concluido";
    }).length;
  }

  function renderizar() {
    atualizarEstatisticas();
    lista.textContent = "";

    const itens = filtrados();
    if (itens.length === 0) {
      const msg = veiculos.length === 0
        ? "Nenhum veículo cadastrado ainda. Use o formulário para começar."
        : "Nenhum veículo encontrado com os filtros atuais.";
      lista.appendChild(el("div", "vazio", msg));
      return;
    }

    itens.forEach(function (v) {
      lista.appendChild(criarCard(v));
    });
  }

  busca.addEventListener("input", renderizar);
  filtroStatus.addEventListener("change", renderizar);

  renderizar();
})();
