import express from "express"; 
import cors from "cors";
import { EstadoEquipesDia } from "./tipos";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// ---------------------------------------------------------------------------
// 🌟 "Banco" em memória
// ---------------------------------------------------------------------------
// Aqui guardamos o estado das equipes de cada AULA (ou dia).
// A chave é o diaId (na verdade estamos usando aula.id).
const estadosPorDia: Record<string, EstadoEquipesDia> = {};


// ---------------------------------------------------------------------------
// 🌟 ROTA PARA OBTER O ESTADO (GET)
// ---------------------------------------------------------------------------
// GET /dias/:diaId/equipes
// Ex.: GET /dias/aula-adulto-22/equipes
app.get("/dias/:diaId/equipes", (req, res) => {
  const { diaId } = req.params;
  const estado = estadosPorDia[diaId];

  // Se não existe ainda, devolvemos um estado vazio
  if (!estado) {
    const vazio: EstadoEquipesDia = {
      diaId,
      jogadores: [],
      equipes: [],
      atribuicoes: [],
    };
    return res.json(vazio);
  }

  return res.json(estado);
});


// ---------------------------------------------------------------------------
// 🌟 ROTA PARA SALVAR O ESTADO (PUT)
// ---------------------------------------------------------------------------
// PUT /dias/:diaId/equipes
// O frontend envia o estado completo das equipes da aula
app.put("/dias/:diaId/equipes", (req, res) => {
  const { diaId } = req.params;
  const body = req.body as Partial<EstadoEquipesDia>;

  // Validação simples
  if (!body.jogadores || !body.equipes || !body.atribuicoes) {
    return res.status(400).json({ erro: "Payload inválido" });
  }

  // Constrói o novo estado
  const novoEstado: EstadoEquipesDia = {
    diaId,
    jogadores: body.jogadores,
    equipes: body.equipes,
    atribuicoes: body.atribuicoes,
  };

  // Salva no "banco"
  estadosPorDia[diaId] = novoEstado;

  return res.json(novoEstado);
});


// ---------------------------------------------------------------------------
// 🌟 SERVIDOR ONLINE
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Jubileu API rodando na porta ${PORT}`);
});
