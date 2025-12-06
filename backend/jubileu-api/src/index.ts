// backend/jubileu-api/src/index.ts
import express from "express";
import cors from "cors";
import { EstadoEquipesDia } from "./tipos";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// ---------------------------------------------------------------------------
// "Banco" em memória: diaId (na verdade aula.id) -> estado
// ---------------------------------------------------------------------------
const estadosPorDia: Record<string, EstadoEquipesDia> = {};

// ---------------------------------------------------------------------------
// GET /dias/:diaId/equipes – devolve o estado atual
// ---------------------------------------------------------------------------
app.get("/dias/:diaId/equipes", (req, res) => {
  const { diaId } = req.params;
  const estado = estadosPorDia[diaId];

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
// PUT /dias/:diaId/equipes – salva snapshot vindo do front
// ---------------------------------------------------------------------------
app.put("/dias/:diaId/equipes", (req, res) => {
  const { diaId } = req.params;
  const body = req.body as Partial<EstadoEquipesDia>;

  if (!body.jogadores || !body.equipes || !body.atribuicoes) {
    return res.status(400).json({ erro: "Payload inválido" });
  }

  const novoEstado: EstadoEquipesDia = {
    diaId,
    jogadores: body.jogadores,
    equipes: body.equipes,
    atribuicoes: body.atribuicoes,
  };

  estadosPorDia[diaId] = novoEstado;
  return res.json(novoEstado);
});

// ---------------------------------------------------------------------------
// Servidor
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Jubileu API rodando na porta ${PORT}`);
});
