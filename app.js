// Configuração da API
const API_URL = 'http://localhost:8000/api';


// Estado Global
let carrinho = [];
let produtos = [];
let clientes = [];
let vendas = [];
let chart = null;


// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    carregarLogo();
    atualizarData();
    carregarDados();
    configurarEventos();
    configurarPWA();
});


async function carregarDados() {
    try {
        await Promise.all([
            carregarProdutos(),
            carregarClientes(),
            carregarVendas()
        ]);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarNotificacao('Erro ao carregar dados. Verifique a conexão com o servidor.', 'erro');
    }
}


async function carregarProdutos() {
    try {
        const response = await fetch(`${API_URL}/produtos`);
        produtos = await response.json();
        atualizarSelectProdutos();
        atualizarTabelaEstoque();
        atualizarStatsEstoque();
    } catch (error) {
        // Dados de exemplo para teste
        produtos = [
            { id: 1, nome: 'Arroz 5kg', preco: 25.90, quantidade: 15 },
            { id: 2, nome: 'Feijão 1kg', preco: 8.90, quantidade: 8 },
            { id: 3, nome: 'Açúcar 1kg', preco: 4.50, quantidade: 3 },
            { id: 4, nome: 'Óleo 900ml', preco: 7.90, quantidade: 12 }
        ];
        atualizarSelectProdutos();
        atualizarTabelaEstoque();
        atualizarStatsEstoque();
    }
}


async function carregarClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes`);
        clientes = await response.json();
        atualizarSelectClientes();
        atualizarCardsClientes();
        atualizarListaFiado();
    } catch (error) {
        clientes = [
            { id: 1, nome: 'Maria Silva', telefone: '(11) 99999-1234', limite_fiado: 100, debito: 50 },
            { id: 2, nome: 'José Santos', telefone: '(11) 98888-5678', limite_fiado: 200, debito: 30 }
        ];
        atualizarSelectClientes();
        atualizarCardsClientes();
        atualizarListaFiado();
    }
}


async function carregarVendas() {
    try {
        const response = await fetch(`${API_URL}/vendas`);
        vendas = await response.json();
        atualizarUltimasVendas();
        atualizarRelatorios();
    } catch (error) {
        vendas = [
            { id: 1, cliente_id: null, total: 45.80, data: new Date().toISOString() },
            { id: 2, cliente_id: 1, total: 23.50, data: new Date().toISOString() }
        ];
        atualizarUltimasVendas();
        atualizarRelatorios();
    }
}


// ==================== LOGO ====================
function carregarLogo() {
    const logoSalva = localStorage.getItem('logoMercearia');
    if (logoSalva) {
        const logoPlaceholder = document.querySelector('.logo-placeholder');
        logoPlaceholder.innerHTML = `<img src="${logoSalva}" alt="Logo">`;
    }
}


document.getElementById('editLogoBtn').addEventListener('click', () => {
    document.getElementById('logoUpload').click();
});


document.getElementById('logoUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const logoPlaceholder = document.querySelector('.logo-placeholder');
            logoPlaceholder.innerHTML = `<img src="${event.target.result}" alt="Logo">`;
            localStorage.setItem('logoMercearia', event.target.result);
            mostrarNotificacao('Logo atualizada com sucesso!', 'sucesso');
        };
        reader.readAsDataURL(file);
    }
});


// ==================== DATA ====================
function atualizarData() {
    const dataElement = document.getElementById('currentDate');
    if (dataElement) {
        const data = new Date();
        dataElement.textContent = data.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}


// ==================== EVENTOS ====================
function configurarEventos() {
    // Navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            trocarPagina(page);
        });
    });


    // Botões de ação
    document.getElementById('addProdutoBtn')?.addEventListener('click', adicionarAoCarrinho);
    document.getElementById('finalizarVendaBtn')?.addEventListener('click', finalizarVenda);
    document.getElementById('limparCarrinhoBtn')?.addEventListener('click', limparCarrinho);
    document.getElementById('addProdutoModalBtn')?.addEventListener('click', () => abrirModal('produtoModal'));
    document.getElementById('addClienteModalBtn')?.addEventListener('click', () => abrirModal('clienteModal'));
   
    // Modais
    document.getElementById('fecharProdutoModal')?.addEventListener('click', () => fecharModal('produtoModal'));
    document.getElementById('fecharClienteModal')?.addEventListener('click', () => fecharModal('clienteModal'));
    document.getElementById('fecharPagamentoModal')?.addEventListener('click', () => fecharModal('pagamentoModal'));
   
    document.getElementById('salvarProdutoBtn')?.addEventListener('click', salvarProduto);
    document.getElementById('salvarClienteBtn')?.addEventListener('click', salvarCliente);
    document.getElementById('confirmarPagamentoBtn')?.addEventListener('click', confirmarPagamento);
   
    // Filtros
    document.getElementById('buscaProduto')?.addEventListener('input', filtrarEstoque);
    document.getElementById('buscaCliente')?.addEventListener('input', filtrarClientes);
    document.getElementById('atualizarRelatorioBtn')?.addEventListener('click', atualizarRelatorios);
}


function trocarPagina(page) {
    // Atualizar botões
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === page) btn.classList.add('active');
    });
   
    // Atualizar páginas
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`${page}-page`).classList.add('active');
}


function abrirModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}


function fecharModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}


// ==================== CARRINHO ====================
function adicionarAoCarrinho() {
    const produtoSelect = document.getElementById('produtoSelect');
    const quantidade = parseInt(document.getElementById('quantidadeProduto').value);
   
    const produtoId = parseInt(produtoSelect.value);
    if (!produtoId) {
        mostrarNotificacao('Selecione um produto!', 'aviso');
        return;
    }
   
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;
   
    if (quantidade > produto.quantidade) {
        mostrarNotificacao(`Estoque insuficiente! Disponível: ${produto.quantidade}`, 'erro');
        return;
    }
   
    const itemExistente = carrinho.find(item => item.id === produtoId);
    if (itemExistente) {
        itemExistente.quantidade += quantidade;
    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: quantidade
        });
    }
   
    atualizarCarrinho();
    document.getElementById('quantidadeProduto').value = 1;
}


function atualizarCarrinho() {
    const carrinhoLista = document.getElementById('carrinhoLista');
    let total = 0;
   
    if (carrinho.length === 0) {
        carrinhoLista.innerHTML = '<p class="empty-carrinho">Nenhum produto adicionado</p>';
        document.getElementById('totalVenda').textContent = 'R$ 0,00';
        return;
    }
   
    carrinhoLista.innerHTML = carrinho.map(item => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;
        return `
            <div class="carrinho-item">
                <div class="carrinho-item-info">
                    <div class="carrinho-item-nome">${item.nome}</div>
                    <div class="carrinho-item-preco">R$ ${item.preco.toFixed(2)}</div>
                </div>
                <div class="carrinho-item-quantidade">${item.quantidade}x</div>
                <div class="carrinho-item-total">R$ ${subtotal.toFixed(2)}</div>
                <button class="carrinho-item-remove" onclick="removerDoCarrinho(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
   
    document.getElementById('totalVenda').textContent = `R$ ${total.toFixed(2)}`;
}


function removerDoCarrinho(id) {
    carrinho = carrinho.filter(item => item.id !== id);
    atualizarCarrinho();
}


function limparCarrinho() {
    carrinho = [];
    atualizarCarrinho();
}


async function finalizarVenda() {
    if (carrinho.length === 0) {
        mostrarNotificacao('Adicione produtos ao carrinho!', 'aviso');
        return;
    }
   
    const clienteId = document.getElementById('clienteSelect').value;
    const total = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
   
    // Verificar limite de fiado
    if (clienteId) {
        const cliente = clientes.find(c => c.id === parseInt(clienteId));
        if (cliente && (cliente.debito || 0) + total > cliente.limite_fiado) {
            mostrarNotificacao('Cliente excedeu o limite de fiado!', 'erro');
            return;
        }
    }
   
    try {
        const venda = {
            cliente_id: clienteId || null,
            itens: carrinho,
            total: total,
            data: new Date().toISOString()
        };
       
        const response = await fetch(`${API_URL}/vendas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(venda)
        });
       
        if (response.ok) {
            mostrarNotificacao('Venda finalizada com sucesso!', 'sucesso');
            limparCarrinho();
            await carregarDados();
        } else {
            throw new Error('Erro ao finalizar venda');
        }
    } catch (error) {
        // Simulação local
        vendas.unshift({
            id: Date.now(),
            cliente_id: clienteId || null,
            total: total,
            data: new Date().toISOString()
        });
       
        // Atualizar estoque local
        carrinho.forEach(item => {
            const produto = produtos.find(p => p.id === item.id);
            if (produto) produto.quantidade -= item.quantidade;
        });
       
        if (clienteId) {
            const cliente = clientes.find(c => c.id === parseInt(clienteId));
            if (cliente) cliente.debito = (cliente.debito || 0) + total;
        }
       
        mostrarNotificacao('Venda finalizada com sucesso!', 'sucesso');
        limparCarrinho();
        await carregarDados();
    }
}


// ==================== ESTOQUE ====================
function atualizarSelectProdutos() {
    const select = document.getElementById('produtoSelect');
    if (select) {
        select.innerHTML = '<option value="">Selecione um produto</option>' +
            produtos.map(p => `<option value="${p.id}">${p.nome} - R$ ${p.preco.toFixed(2)} (${p.quantidade} und)</option>`).join('');
    }
}


function atualizarTabelaEstoque() {
    const tbody = document.getElementById('estoqueBody');
    if (!tbody) return;
   
    tbody.innerHTML = produtos.map(p => `
        <tr>
            <td>${p.nome}</td>
            <td>R$ ${p.preco.toFixed(2)}</td>
            <td class="${p.quantidade < 10 ? 'estoque-baixo' : ''}">${p.quantidade} und</td>
            <td>
                <button class="btn-editar" onclick="editarProduto(${p.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-excluir" onclick="excluirProduto(${p.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}


function atualizarStatsEstoque() {
    const totalProdutos = produtos.length;
    const produtosBaixo = produtos.filter(p => p.quantidade < 10).length;
   
    document.getElementById('totalProdutos').textContent = totalProdutos;
    document.getElementById('produtosBaixo').textContent = produtosBaixo;
}


function filtrarEstoque() {
    const busca = document.getElementById('buscaProduto').value.toLowerCase();
    const filtro = document.getElementById('filtroEstoque').value;
   
    let produtosFiltrados = produtos;
   
    if (busca) {
        produtosFiltrados = produtosFiltrados.filter(p => p.nome.toLowerCase().includes(busca));
    }
   
    if (filtro === 'baixo') {
        produtosFiltrados = produtosFiltrados.filter(p => p.quantidade < 10);
    }
   
    const tbody = document.getElementById('estoqueBody');
    tbody.innerHTML = produtosFiltrados.map(p => `
        <tr>
            <td>${p.nome}</td>
            <td>R$ ${p.preco.toFixed(2)}</td>
            <td class="${p.quantidade < 10 ? 'estoque-baixo' : ''}">${p.quantidade} und</td>
            <td>
                <button class="btn-editar" onclick="editarProduto(${p.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-excluir" onclick="excluirProduto(${p.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}


async function salvarProduto() {
    const nome = document.getElementById('produtoNome').value;
    const preco = parseFloat(document.getElementById('produtoPreco').value);
    const quantidade = parseInt(document.getElementById('produtoEstoque').value);
   
    if (!nome || !preco || preco <= 0) {
        mostrarNotificacao('Preencha todos os campos corretamente!', 'aviso');
        return;
    }
   
    try {
        const response = await fetch(`${API_URL}/produtos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, preco, quantidade: quantidade || 0 })
        });
       
        if (response.ok) {
            mostrarNotificacao('Produto cadastrado com sucesso!', 'sucesso');
            fecharModal('produtoModal');
            limparFormProduto();
            await carregarProdutos();
        }
    } catch (error) {
        // Simulação local
        produtos.push({
            id: Date.now(),
            nome: nome,
            preco: preco,
            quantidade: quantidade || 0
        });
        mostrarNotificacao('Produto cadastrado com sucesso!', 'sucesso');
        fecharModal('produtoModal');
        limparFormProduto();
        atualizarSelectProdutos();
        atualizarTabelaEstoque();
        atualizarStatsEstoque();
    }
}


function limparFormProduto() {
    document.getElementById('produtoNome').value = '';
    document.getElementById('produtoPreco').value = '';
    document.getElementById('produtoEstoque').value = '';
}


function editarProduto(id) {
    const produto = produtos.find(p => p.id === id);
    if (produto) {
        document.getElementById('produtoNome').value = produto.nome;
        document.getElementById('produtoPreco').value = produto.preco;
        document.getElementById('produtoEstoque').value = produto.quantidade;
        abrirModal('produtoModal');
       
        const salvarBtn = document.getElementById('salvarProdutoBtn');
        const originalClick = salvarBtn.onclick;
        salvarBtn.onclick = () => atualizarProduto(id);
    }
}


async function atualizarProduto(id) {
    const nome = document.getElementById('produtoNome').value;
    const preco = parseFloat(document.getElementById('produtoPreco').value);
    const quantidade = parseInt(document.getElementById('produtoEstoque').value);
   
    const produto = produtos.find(p => p.id === id);
    if (produto) {
        produto.nome = nome;
        produto.preco = preco;
        produto.quantidade = quantidade;
       
        mostrarNotificacao('Produto atualizado!', 'sucesso');
        fecharModal('produtoModal');
        limparFormProduto();
        atualizarSelectProdutos();
        atualizarTabelaEstoque();
        atualizarStatsEstoque();
       
        const salvarBtn = document.getElementById('salvarProdutoBtn');
        salvarBtn.onclick = salvarProduto;
    }
}


function excluirProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        produtos = produtos.filter(p => p.id !== id);
        mostrarNotificacao('Produto excluído!', 'sucesso');
        atualizarSelectProdutos();
        atualizarTabelaEstoque();
        atualizarStatsEstoque();
    }
}


// ==================== CLIENTES ====================
function atualizarSelectClientes() {
    const select = document.getElementById('clienteSelect');
    if (select) {
        select.innerHTML = '<option value="">Consumidor Final</option>' +
            clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    }
}


function atualizarCardsClientes() {
    const container = document.getElementById('clientesCards');
    if (!container) return;
   
    container.innerHTML = clientes.map(c => `
        <div class="card-cliente">
            <h3><i class="fas fa-user"></i> ${c.nome}</h3>
            <p><i class="fas fa-phone"></i> ${c.telefone || 'Não informado'}</p>
            <div class="debito">Débito: R$ ${(c.debito || 0).toFixed(2)}</div>
            <div class="limite">Limite: R$ ${(c.limite_fiado || 0).toFixed(2)}</div>
            <button class="btn-pagar" onclick="abrirPagamento(${c.id})">
                <i class="fas fa-hand-holding-usd"></i> Receber Pagamento
            </button>
        </div>
    `).join('');
}


function filtrarClientes() {
    const busca = document.getElementById('buscaCliente').value.toLowerCase();
    const container = document.getElementById('clientesCards');
   
    const clientesFiltrados = clientes.filter(c => c.nome.toLowerCase().includes(busca));
   
    container.innerHTML = clientesFiltrados.map(c => `
        <div class="card-cliente">
            <h3><i class="fas fa-user"></i> ${c.nome}</h3>
            <p><i class="fas fa-phone"></i> ${c.telefone || 'Não informado'}</p>
            <div class="debito">Débito: R$ ${(c.debito || 0).toFixed(2)}</div>
            <div class="limite">Limite: R$ ${(c.limite_fiado || 0).toFixed(2)}</div>
            <button class="btn-pagar" onclick="abrirPagamento(${c.id})">
                <i class="fas fa-hand-holding-usd"></i> Receber Pagamento
            </button>
        </div>
    `).join('');
}


async function salvarCliente() {
    const nome = document.getElementById('clienteNome').value;
    const telefone = document.getElementById('clienteTelefone').value;
    const limite = parseFloat(document.getElementById('clienteLimite').value) || 0;
   
    if (!nome) {
        mostrarNotificacao('Nome do cliente é obrigatório!', 'aviso');
        return;
    }
   
    try {
        const response = await fetch(`${API_URL}/clientes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, telefone, limite_fiado: limite })
        });
       
        if (response.ok) {
            mostrarNotificacao('Cliente cadastrado com sucesso!', 'sucesso');
            fecharModal('clienteModal');
            limparFormCliente();
            await carregarClientes();
        }
    } catch (error) {
        clientes.push({
            id: Date.now(),
            nome: nome,
            telefone: telefone,
            limite_fiado: limite,
            debito: 0
        });
        mostrarNotificacao('Cliente cadastrado com sucesso!', 'sucesso');
        fecharModal('clienteModal');
        limparFormCliente();
        atualizarSelectClientes();
        atualizarCardsClientes();
        atualizarListaFiado();
    }
}


function limparFormCliente() {
    document.getElementById('clienteNome').value = '';
    document.getElementById('clienteTelefone').value = '';
    document.getElementById('clienteLimite').value = '';
}


// ==================== FIADO ====================
function atualizarListaFiado() {
    const container = document.getElementById('listaFiado');
    if (!container) return;
   
    const clientesComDebito = clientes.filter(c => (c.debito || 0) > 0);
    const totalFiado = clientesComDebito.reduce((sum, c) => sum + (c.debito || 0), 0);
   
    document.getElementById('totalFiado').textContent = `R$ ${totalFiado.toFixed(2)}`;
   
    if (clientesComDebito.length === 0) {
        container.innerHTML = '<p class="empty-carrinho">Nenhum cliente com débito</p>';
        return;
    }
   
    container.innerHTML = clientesComDebito.map(c => `
        <div class="card-cliente">
            <h3><i class="fas fa-user"></i> ${c.nome}</h3>
            <div class="debito">Débito: R$ ${(c.debito || 0).toFixed(2)}</div>
            <div class="limite">Limite: R$ ${(c.limite_fiado || 0).toFixed(2)}</div>
            <button class="btn-pagar" onclick="abrirPagamento(${c.id})">
                <i class="fas fa-hand-holding-usd"></i> Receber Pagamento
            </button>
        </div>
    `).join('');
}


let clientePagamentoAtual = null;


function abrirPagamento(clienteId) {
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
        clientePagamentoAtual = cliente;
        document.getElementById('pagamentoClienteNome').textContent = cliente.nome;
        document.getElementById('pagamentoDebito').textContent = `R$ ${(cliente.debito || 0).toFixed(2)}`;
        document.getElementById('pagamentoValor').value = (cliente.debito || 0).toFixed(2);
        abrirModal('pagamentoModal');
    }
}


function confirmarPagamento() {
    const valor = parseFloat(document.getElementById('pagamentoValor').value);
   
    if (!clientePagamentoAtual || isNaN(valor) || valor <= 0) {
        mostrarNotificacao('Valor inválido!', 'aviso');
        return;
    }
   
    const debitoAtual = clientePagamentoAtual.debito || 0;
   
    if (valor > debitoAtual) {
        mostrarNotificacao('Valor maior que o débito!', 'aviso');
        return;
    }
   
    clientePagamentoAtual.debito = debitoAtual - valor;
   
    mostrarNotificacao(`Pagamento de R$ ${valor.toFixed(2)} recebido com sucesso!`, 'sucesso');
    fecharModal('pagamentoModal');
    clientePagamentoAtual = null;
   
    atualizarCardsClientes();
    atualizarListaFiado();
}


// ==================== VENDAS ====================
function atualizarUltimasVendas() {
    const container = document.getElementById('ultimasVendasLista');
    if (!container) return;
   
    const ultimasVendas = vendas.slice(0, 5);
   
    if (ultimasVendas.length === 0) {
        container.innerHTML = '<p class="empty-carrinho">Nenhuma venda realizada hoje</p>';
        return;
    }
   
    container.innerHTML = ultimasVendas.map(v => {
        const cliente = v.cliente_id ? clientes.find(c => c.id === v.cliente_id) : null;
        const data = new Date(v.data);
        return `
            <div class="carrinho-item">
                <div class="carrinho-item-info">
                    <div class="carrinho-item-nome">
                        ${cliente ? cliente.nome : 'Consumidor Final'}
                    </div>
                    <div class="carrinho-item-preco">
                        ${data.toLocaleTimeString('pt-BR')}
                    </div>
                </div>
                <div class="carrinho-item-total">
                    R$ ${v.total.toFixed(2)}
                </div>
            </div>
        `;
    }).join('');
}


// ==================== RELATÓRIOS ====================
function atualizarRelatorios() {
    const periodo = document.getElementById('periodoRelatorio').value;
    const agora = new Date();
    let inicioPeriodo;
   
    switch (periodo) {
        case 'dia':
            inicioPeriodo = new Date(agora.setHours(0, 0, 0, 0));
            break;
        case 'semana':
            inicioPeriodo = new Date(agora.setDate(agora.getDate() - 7));
            break;
        case 'mes':
            inicioPeriodo = new Date(agora.setMonth(agora.getMonth() - 1));
            break;
        default:
            inicioPeriodo = new Date(agora.setHours(0, 0, 0, 0));
    }
   
    const vendasPeriodo = vendas.filter(v => new Date(v.data) >= inicioPeriodo);
    const totalVendas = vendasPeriodo.reduce((sum, v) => sum + v.total, 0);
   
    document.getElementById('totalVendasPeriodo').textContent = `R$ ${totalVendas.toFixed(2)}`;
   
    // Gráfico de produtos mais vendidos
    const vendasProdutos = {};
    vendasPeriodo.forEach(venda => {
        if (venda.itens) {
            venda.itens.forEach(item => {
                vendasProdutos[item.nome] = (vendasProdutos[item.nome] || 0) + item.quantidade;
            });
        }
    });
   
    const produtosOrdenados = Object.entries(vendasProdutos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
   
    const ctx = document.getElementById('graficoProdutos');
    if (ctx && chart) chart.destroy();
   
    if (ctx) {
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: produtosOrdenados.map(p => p[0]),
                datasets: [{
                    label: 'Quantidade Vendida',
                    data: produtosOrdenados.map(p => p[1]),
                    backgroundColor: '#4CAF50',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}


// ==================== PWA ====================
function configurarPWA() {
    let deferredPrompt;
   
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('installBtn').style.display = 'block';
    });
   
    document.getElementById('installBtn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                document.getElementById('installBtn').style.display = 'none';
            }
            deferredPrompt = null;
        }
    });
}


// ==================== NOTIFICAÇÕES ====================
function mostrarNotificacao(mensagem, tipo) {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    notificacao.innerHTML = `
        <i class="fas fa-${tipo === 'sucesso' ? 'check-circle' : tipo === 'erro' ? 'times-circle' : 'exclamation-circle'}"></i>
        <span>${mensagem}</span>
    `;
   
    notificacao.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 12px;
        background: ${tipo === 'sucesso' ? '#4CAF50' : tipo === 'erro' ? '#ff4444' : '#ff9800'};
        color: white;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
   
    document.body.appendChild(notificacao);
   
    setTimeout(() => {
        notificacao.remove();
    }, 3000);
}


// Adicionar estilo para notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);