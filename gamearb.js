const CONTRACT_ADDRESS = "0x4d7A5aF32d2b5ec7734e2D4EBe17E8260441fdd2";
const TOKEN_ADDRESS = "0x532BafEb091a55F54079772dcCFC2Ba730A727F7";
//----------------------------------------------------------------------//
const abiContrato = [{
        inputs: [],
        name: "pagarParaJogar",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{
            internalType: "uint8",
            name: "escolha",
            type: "uint8",
        }, ],
        name: "jogar",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "sacarPremio",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{
            internalType: "address",
            name: "jogador",
            type: "address",
        }, ],
        name: "verUltimoResultado",
        outputs: [{
            internalType: "uint8",
            name: "",
            type: "uint8",
        }, ],
        stateMutability: "view",
        type: "function",
    },
    {
        anonymous: false,
        inputs: [{
                indexed: true,
                internalType: "address",
                name: "jogador",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint8",
                name: "jogadorEscolha",
                type: "uint8",
            },
            {
                indexed: false,
                internalType: "uint8",
                name: "contratoEscolha",
                type: "uint8",
            },
            {
                indexed: false,
                internalType: "uint8",
                name: "resultado",
                type: "uint8",
            },
        ],
        name: "JogoRealizado",
        type: "event",
    },
    {
        inputs: [{
            internalType: "address",
            name: "jogador",
            type: "address"
        }],
        name: "verHistorico",
        outputs: [{
            components: [{
                    internalType: "uint8",
                    name: "jogadorEscolha",
                    type: "uint8"
                },
                {
                    internalType: "uint8",
                    name: "contratoEscolha",
                    type: "uint8"
                },
                {
                    internalType: "uint8",
                    name: "resultado",
                    type: "uint8"
                },
                {
                    internalType: "uint256",
                    name: "timestamp",
                    type: "uint256"
                }
            ],
            internalType: "struct PedraPapelTesoura.Jogada[]",
            name: "",
            type: "tuple[]"
        }],
        stateMutability: "view",
        type: "function"
    },
];
//----------------------------------------------------------------------//
const abiERC20 = [{
        constant: false,
        inputs: [
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" }
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        type: "function"
    },
    {
        constant: true,
        inputs: [{ name: "owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        type: "function"
    },
    {
        constant: true,
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" }
        ],
        name: "allowance",
        outputs: [{ name: "", type: "uint256" }],
        type: "function"
    }
];
//----------------------------------------------------------------------//
let web3, contrato, token, conta;
async function conectar() {
    if (!window.ethereum) {
        alert("Instale o Metamask.");
        return;
    }

    web3 = new Web3(window.ethereum);

    try {

        await ethereum.request({ method: "eth_requestAccounts" });


        await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x66eee" }],
        });
    } catch (err) {

        if (err.code === 4902) {
            try {
                await ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: "0x66eee",
                        chainName: "Arbitrum Sepolia Testnet",
                        nativeCurrency: {
                            name: "Arbitrum SepoliaETH",
                            symbol: "ETH",
                            decimals: 18,
                        },
                        rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
                        blockExplorerUrls: ["https://sepolia.arbiscan.io/"],
                    }],
                });
            } catch (addErr) {
                console.error("Error adding Arbitrum Sepolia network:", addErr);
                return;
            }
        } else {
            console.error("Error switching network:", err);
            return;
        }
    }

    const contas = await web3.eth.getAccounts();
    conta = contas[0];
    document.getElementById("conta").innerText = conta;

    contrato = new web3.eth.Contract(abiContrato, CONTRACT_ADDRESS);
    token = new web3.eth.Contract(abiERC20, TOKEN_ADDRESS);

    await atualizarSaldos();
    await exibirHistoricoJogadas();
    await exibirEstagioJogador();
    mostrarBotaoHistorico();
    // const light = document.getElementById("lcon");
    // light.classList.add("light-on");
    const btn = document.querySelector(".wcnct");
    btn.classList.add("wallet-connected");
    btn.innerText = "Connected";
    digitarTexto("Hello!");
}

//----------------------------------------------------------------------------------//

// async function pagar() {
//     const valor = web3.utils.toWei("1", "ether");
//     try {
//         digitarTexto("Approve in your wallet...");
//         await token.methods.approve(CONTRACT_ADDRESS, valor).send({ from: conta });

//         await contrato.methods.pagarParaJogar().send({ from: conta });

//         digitarTexto("Payment completed. You can now play!");
//     } catch (e) {
//         console.error(e);
//         digitarTexto("Payment failed. Try again.");
//     }
// }

async function pagar() {
    const valor = web3.utils.toWei("1", "ether");

    try {
        const allowance = await token.methods.allowance(conta, CONTRACT_ADDRESS).call();

        if (BigInt(allowance) < BigInt(valor)) {
            digitarTexto("Approve in your wallet...");
            await token.methods.approve(CONTRACT_ADDRESS, valor).send({ from: conta });
        }

        digitarTexto("Processing payment...");
        await contrato.methods.pagarParaJogar().send({ from: conta });

        digitarTexto("Payment completed. You can now play!");
    } catch (e) {
        console.error(e);
        digitarTexto("Payment failed. Try again.");
    }
}

//----------------------------------------------------------------------------------//

async function jogar(escolha) {
    const resultadoEl = document.getElementById("resultado");
    const dueloEl = document.getElementById("duelo");
    const imgJogador = document.getElementById("img-jogador");
    const hashEl = document.getElementById("tx-hash");
    const walker = document.getElementById("walker");
    digitarTexto("Processing");
    const imagens = ["img/hstg.png", "img/hpg.png", "img/hsg.png"];

    try {
        // Exibe a escolha do jogador imediatamente
        dueloEl.style.display = "block";
        imgJogador.src = imagens[escolha];
        imgJogador.alt = `Escolha do jogador: ${imagens[escolha].split(".")[0]
        }`;

        walker.src = "img/ght.gif";
        resultadoEl.innerText = "";
        hashEl.innerHTML = "";
        document.getElementById("duelo-texto").innerText = "";

        await contrato.methods
            .jogar(escolha)
            .send({ from: conta })
            .on("receipt", async(tx) => {
                const hash = tx.transactionHash;
                hashEl.innerHTML = `Tx Hash:<a style = "font-size : 12px;" href="https://sepolia.arbiscan.io/tx/${hash}" target="_blank">Check</a>`;

                // let evento = null;

                // if (
                //     tx.events &&
                //     tx.events.JogoRealizado &&
                //     tx.events.JogoRealizado.returnValues
                //     ) 
                //     { evento = tx.events.JogoRealizado.returnValues; }

                // if (evento) {
                //     const jogadorEscolha = parseInt(evento.jogadorEscolha);
                //     const contratoEscolha = parseInt(evento.contratoEscolha);
                //     const resultado = parseInt(evento.resultado);

                //     atualizarDuelo(jogadorEscolha, contratoEscolha);
                //     mostrarResultado(resultado);
                // } else {
                //     const dados = await buscarUltimoEventoDaConta(conta);
                //     if (dados) {
                //         atualizarDuelo(dados.jogadorEscolha, dados.contratoEscolha);
                //     }
                // }

                const resultado = await contrato.methods
                    .verUltimoResultado(conta)
                    .call();

                mostrarResultado(resultado);
                await exibirHistoricoJogadas();

                if (parseInt(resultado) === 2) {
                    await sacar();
                }
            });
    } catch (e) {
        console.error(e);
        digitarTexto("Error playing the game");
    } finally {
        walker.src = "img/walk.gif";
    }
}

//----------------------------------------------------------------------------------//

// async function buscarUltimoEventoDaConta(conta) {
//     try {
//         const latestBlock = await web3.eth.getBlockNumber();
//         const fromBlock = Math.max(latestBlock - 5000, 0); // últimos 5000 blocos

//         const eventos = await contrato.getPastEvents("JogoRealizado", {
//             filter: { jogador: conta },
//             fromBlock,
//             toBlock: "latest",
//         });

//         if (eventos.length === 0) {
//             console.log("No event found.");
//             return null;
//         }

//         const ultimoEvento = eventos[eventos.length - 1];
//         const dados = ultimoEvento.returnValues;

//         return {
//             jogadorEscolha: parseInt(dados.jogadorEscolha),
//             contratoEscolha: parseInt(dados.contratoEscolha),
//         };
//     } catch (e) {
//         console.error("Error fetching events:", e);
//         return null;
//     }
// }

//----------------------------------------------------------------------------------//
async function sacar() {
    try {
        await contrato.methods.sacarPremio().send({
            from: conta,
        });
        digitarTexto("Prize withdrawn!");
    } catch (e) {
        console.error(e);
        digitarTexto("Error withdrawing prize.");
    }
}

//----------------------------------------------------------------------------------//

function mostrarResultado(resultado) {
    const r = parseInt(resultado);
    const txt = ["❌ Loss", "🤝 Draw", "🏆 Victory"];
    document.getElementById("resultado").innerText = txt[r];
    digitarTexto("Bet and play again");
}

function atualizarDuelo(jogador, contrato) {
    const nomes = ["Pedra", "Papel", "Tesoura"];
    const j = parseInt(jogador);
    const c = parseInt(contrato);
    document.getElementById("duelo").innerText =
        "Você jogou: " + nomes[j] + " | O contrato jogou: " + nomes[c];
}

//----------------------------------------------------------------------------------//

async function atualizarSaldos() {
    try {
        // Saldo em ETH
        const saldoWei = await web3.eth.getBalance(conta);
        const saldoEth = web3.utils.fromWei(saldoWei, "ether");
        document.getElementById("saldo-eth").innerText = "ETH " + parseFloat(saldoEth).toFixed(4);

        // Saldo do token
        const saldoToken = await token.methods.balanceOf(conta).call();
        const saldoTokenFormatado = web3.utils.fromWei(saldoToken, "ether");
        document.getElementById("saldo-token").innerText = "JKP " + parseInt(saldoTokenFormatado).toFixed(4);
    } catch (err) {
        console.error("Erro ao buscar saldos:", err);
    }
}

//----------------------------------------------------------------------------------//

async function exibirHistoricoJogadas() {
    try {
        const historico = await contrato.methods.verHistorico(conta).call();

        const tabela = document.getElementById("historico");
        tabela.innerHTML = `
            <tr>
                <th>You</th>
                <th>Contract</th>
                <th>Result</th>
                <th>Data</th>
            </tr>
        `;

        if (historico.length === 0) {
            tabela.innerHTML += "<tr><td colspan='4'>Nenhuma jogada registrada.</td></tr>";
            return;
        }

        historico.forEach(jogada => {
            const escolhas = ["Rock", "Paper", "Scissors"];
            const resultados = ["Loss", "Draw", "Victory"];
            const data = new Date(jogada.timestamp * 1000).toLocaleString();

            tabela.innerHTML += `
                <tr>
                    <td>${escolhas[jogada.jogadorEscolha]}</td>
                    <td>${escolhas[jogada.contratoEscolha]}</td>
                    <td>${resultados[jogada.resultado]}</td>
                    <td>${data}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Erro ao buscar histórico:", err);
    }
}

//----------------------------------------------------------------------------------//

function alternarTabela() {
    const div = document.getElementById("historico-container");
    div.style.display = div.style.display === "none" ? "block" : "none";
}

function mostrarBotaoHistorico() {
    document.getElementById("btn-historico").style.display = "inline-block";
}

//----------------------------------------------------------------------------------//

function abrirModal() {
    document.getElementById("popupModal").style.display = "block";
}

function fecharModal() {
    document.getElementById("popupModal").style.display = "none";
}

//----------------------------------------------------------------------------------//

function digitarTexto(texto, elementoId = "mensagem", velocidade = 50) {
    const el = document.getElementById(elementoId);
    el.innerHTML = "";
    let i = 0;

    function digitar() {
        if (i < texto.length) {
            el.innerHTML += texto.charAt(i);
            i++;
            setTimeout(digitar, velocidade);
        }
    }

    digitar();
}

// async function exibirEstagioJogador() {
//     try {
//         const historico = await contrato.methods.verHistorico(conta).call();

//         let vitorias = 0;

//         historico.forEach(jogada => {
//             if (parseInt(jogada.resultado) === 2) {
//                 vitorias++;
//             }
//         });

//         let estagio = "Nenhum progresso ainda";
//         let walk = "";

//         if (vitorias >= 10) {
//             estagio = "Boss";
//             walk = "X - X - X - - - - X -> NEXT";
//         } else if (vitorias >= 5) {
//             estagio = "Stage 3";
//             walk = "X - X - X - - - - BOSS";
//         } else if (vitorias >= 3) {
//             estagio = "Stage 2";
//             walk = "X - X - 3 - - - - BOSS";
//         } else if (vitorias >= 1) {
//             estagio = "Stage 1";
//             walk = "X - 2 - 3 - - - - BOSS";
//         }

//         const estagioElemento = document.getElementById("estagio");
//         estagioElemento.innerHTML = `Progress: ${estagio} (${vitorias} Victorys)<br><p class="lvl"> ${walk}</p>`;

//     } catch (err) {
//         console.error("Erro ao calcular estágio:", err);
//     }
// }

async function exibirEstagioJogador() {
    try {
        const historico = await contrato.methods.verHistorico(conta).call();

        let vitorias = 0;

        historico.forEach(jogada => {
            if (parseInt(jogada.resultado) === 2) {
                vitorias++;
            }
        });

        let estagio = "0";
        let walk = "";
        let lvl = 0;
        let dots = " - - - ";
        if (vitorias >= 20) {
            lvl = 4;
            estagio = "lvl - " + lvl;
            walk = '<div class="lvl"><p class="green"> 01 </p> ' + dots + '<p class="green"> 02 </p> ' + dots + '<p class="green"> 03 </p> ' + dots + '<p class="green"> 04 </p>' + dots + '<p class="green"> 05 </p> </div>';
        } else if (vitorias >= 10) {
            lvl = 4;
            estagio = "lvl - " + lvl;
            walk = '<div class="lvl"><p class="green"> 01 </p> ' + dots + '<p class="green"> 02 </p> ' + dots + '<p class="green"> 03 </p> ' + dots + '<p class="green"> 04 </p>' + dots + '<p class="blue"> 05 </p> </div>';
        } else if (vitorias >= 5) {
            lvl = 3;
            estagio = "lvl - " + lvl;
            walk = '<div class="lvl"><p class="green"> 01 </p> ' + dots + '<p class="green"> 02 </p> ' + dots + '<p class="green"> 03 </p> ' + dots + '<p class="blue"> 04 </p>' + dots + '<p class="blue"> 05 </p> </div>';
        } else if (vitorias >= 3) {
            lvl = 2;
            estagio = "lvl - " + lvl;
            walk = '<div class="lvl"><p class="green"> 01 </p> ' + dots + '<p class="green"> 02 </p> ' + dots + '<p class="blue"> 03 </p> ' + dots + '<p class="blue"> 04 </p>' + dots + '<p class="blue"> 05 </p> </div>';
        } else if (vitorias >= 1) {
            lvl = 1;
            estagio = "lvl - " + lvl;
            walk = '<div class="lvl"><p class="green"> 01 </p> ' + dots + '<p class="blue"> 02 </p> ' + dots + '<p class="blue"> 03 </p> ' + dots + '<p class="blue"> 04 </p> ' + dots + '<p class="blue"> 05 </p> </div>';
        } else if (vitorias = 0) {
            lvl = 0;
            estagio = "lvl - " + lvl;
            walk = '<div class="lvl"><p class="blue"> 01 </p> ' + dots + '<p class="blue"> 02 </p> ' + dots + '<p class="blue"> 03 </p> ' + dots + '<p class="blue"> 04 </p> ' + dots + '<p class="blue"> 05 </p> </div>';
        }

        const estagioElemento = document.getElementById("estagio");
        estagioElemento.innerHTML = `<p class="stage">Progress: ${estagio} (${vitorias} Victorys)</p>${walk}`;

    } catch (err) {
        console.error("Erro ao calcular estágio:", err);
    }
}