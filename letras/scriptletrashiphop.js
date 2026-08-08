import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.9/+esm";

const SUPABASE_URL = 'https://mnckoegfzjhzqtcazjkb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Vi8tsIjVMcfnFstUBgYu8Q_HGuz2MxW';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Ip grabber
async function obterIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        console.log("IP obtido:", data.ip); // Verifica o IP no console
        return data.ip;
    } catch (error) {
        console.error("Erro ao obter o IP:", error);
        return null;
    }
}

let isAdmin = false;
const letrasContainer = document.getElementById('letrasContainer');
const musicNotes = document.getElementById('musicNotes');

function showNotification(message) {
    alert(message);
}

function atualizarBotoesDelete() {
    const deleteBtns = document.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
        btn.style.display = isAdmin ? 'block' : 'none';
    });
}
    async function enviarLetra(nome, titulo, letra) {
    // Obtenha o IP do usuário antes de enviar os dados
    const ip = await obterIP();

    if (!ip) {
        alert("Não foi possível obter seu IP. Tente novamente.");
        return; // Interrompe o envio se o IP não for obtido
    }

    // Envia a letra para o Supabase com o IP incluído
    const { error } = await supabase
        .from('letras')
        .insert([{ nome, titulo, letra, ip }]); // Inclui o IP no registro

    if (error) {
        alert('Erro ao enviar letra: ' + error.message);
    } else {
        alert('Letra enviada com sucesso!');
        await exibirLetras(); // Recarrega a lista de letras após o envio
    }
}


// Declare fora de outras funções para garantir que esteja no escopo global
async function exibirLetras() {
    const ipAtual = await obterIP(); // Obtenha o IP do usuário atual
    const { data: letras, error } = await supabase.from('letras').select('*');

    if (error) {
        console.error('Erro ao carregar letras:', error.message);
        alert('Erro ao carregar letras');
    } else {
        letrasContainer.innerHTML = '';
        letras.forEach(letra => {
            const letraDiv = document.createElement('div');
            letraDiv.className = 'letra-salva';
            letraDiv.innerHTML = `
                <div class="letra-titulo">${letra.titulo}</div>
                <div class="letra-autor">por ${letra.nome}</div>
                <div class="letra-conteudo">${letra.letra}</div>
            `;

            // Adiciona o botão "Editar" se o IP do usuário coincidir com o IP armazenado
            if (letra.ip === ipAtual) {
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.textContent = 'Editar';
                editBtn.addEventListener('click', () => editarLetra(letra));
                letraDiv.appendChild(editBtn);
            }

            // Adiciona o botão "Excluir" se o usuário for administrador
            if (isAdmin) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = 'Excluir';
                deleteBtn.addEventListener('click', () => deletarLetra(letra.id));
                letraDiv.appendChild(deleteBtn);
            }

            letrasContainer.appendChild(letraDiv);
        });
        atualizarBotoesDelete();
    }
}

function editarLetra(letra) {
    const novoTitulo = prompt("Edite o título:", letra.titulo);
    const novaLetra = prompt("Edite a letra:", letra.letra);

    if (novoTitulo && novaLetra) {
        atualizarLetra(letra.id, novoTitulo, novaLetra);
    }
}

async function atualizarLetra(id, titulo, letra) {
    const { error } = await supabase
        .from('letras')
        .update({ titulo, letra })
        .eq('id', id);

    if (error) {
        alert('Erro ao atualizar letra: ' + error.message);
    } else {
        alert('Letra atualizada com sucesso!');
        await exibirLetras();
    }
}


async function deletarLetra(id) {
    if (!isAdmin) return;

    if (confirm('Tem certeza que deseja excluir esta letra?')) {
        const { error } = await supabase
            .from('letras')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Erro ao excluir letra: ' + error.message);
        } else {
            alert('Letra excluída com sucesso!');
            await exibirLetras();
        }
    }
}

function createNote() {
    const notes = ['♪', '♫', '♬', '♩'];
    const note = document.createElement('span');
    note.className = 'note';
    note.textContent = notes[Math.floor(Math.random() * notes.length)];
    note.style.left = Math.random() * 100 + 'vw';
    note.style.animationDuration = (15 + Math.random() * 10) + 's';
    note.style.transform = `rotate(${Math.random() * 360}deg)`;
    musicNotes.appendChild(note);

    note.addEventListener('animationend', () => {
        note.remove();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');

    setInterval(createNote, 1500);
    for (let i = 0; i < 10; i++) {
        setTimeout(createNote, i * 200);
    }

    loginButton.addEventListener('click', function() {
        const username = prompt('Nome de Usuário:');
        const password = prompt('Senha:');

        if (username === 'equipe8' && password === 'admin') {
            isAdmin = true;
            showNotification('Login realizado com sucesso!');
            logoutButton.style.display = 'block';
            loginButton.style.display = 'none';
            exibirLetras();
        } else {
            showNotification('Credenciais inválidas!');
        }
    });

    logoutButton.addEventListener('click', function() {
        isAdmin = false;
        showNotification('Você saiu com sucesso.');
        logoutButton.style.display = 'none';
        loginButton.style.display = 'block';
        exibirLetras();
    });

    document.getElementById('letraForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const nome = document.getElementById('nome').value;
        const titulo = document.getElementById('titulo').value;
        const letra = document.getElementById('letra').value;

        enviarLetra(nome, titulo, letra);
        this.reset();
    });

    exibirLetras();
});
