import { useState } from "react";
import type { EquipeDia, JogadorDia } from "../../types/dia";
import Modal from "../../components/ui/Modal";
import FormJogador from "../../components/dias/FormJogador";
import FormEquipe, {
  type EquipeFormData,
} from "../../components/dias/FormEquipe";

const MOCK_EQUIPES: EquipeDia[] = [
  { id: 1, nome: "Time Azul", corCamisa: "Azul" },
  { id: 2, nome: "Time Laranja", corCamisa: "Laranja" },
];

const MOCK_JOGADORES: JogadorDia[] = [
  { id: 1, nome: "João", apelido: "Joãozinho", status: "presente", equipeId: 1 },
  { id: 2, nome: "Pedro", status: "presente", equipeId: 1 },
  { id: 3, nome: "Carlos", status: "coringa", equipeId: 1 },
  { id: 4, nome: "Lucas", status: "presente", equipeId: 2 },
  { id: 5, nome: "Matheus", status: "so_treinou", equipeId: null }, // começa no pool
];

function statusLabel(status?: JogadorDia["status"]) {
  if (!status) return "";
  switch (status) {
    case "presente":
      return "Presente";
    case "faltou":
      return "Faltou";
    case "coringa":
      return "Coringa";
    case "so_treinou":
      return "Só treinou";
    default:
      return status;
  }
}

export default function DiaEquipesTab() {
  const [equipes, setEquipes] = useState<EquipeDia[]>(MOCK_EQUIPES);
  const [jogadores, setJogadores] = useState<JogadorDia[]>(MOCK_JOGADORES);

  const [modalJogadorAberto, setModalJogadorAberto] = useState(false);
  const [jogadorEmEdicao, setJogadorEmEdicao] = useState<JogadorDia | null>(
    null
  );

  const [modalEquipeAberto, setModalEquipeAberto] = useState(false);
  const [equipeEmEdicao, setEquipeEmEdicao] = useState<EquipeDia | null>(null);

  // Para drag & drop
  const [jogadorArrastandoId, setJogadorArrastandoId] = useState<number | null>(
    null
  );

  const jogadoresNoPool = jogadores.filter((j) => !j.equipeId);
  const jogadoresDaEquipe = (idEquipe: number) =>
    jogadores.filter((j) => j.equipeId === idEquipe);

  function atribuirJogadorAEquipe(idJogador: number, idEquipe: number | null) {
    setJogadores((atual) =>
      atual.map((j) =>
        j.id === idJogador ? { ...j, equipeId: idEquipe } : j
      )
    );
  }

  // ---------- jogador ----------

  function abrirNovoJogador() {
    setJogadorEmEdicao(null);
    setModalJogadorAberto(true);
  }

  function abrirEdicaoJogador(j: JogadorDia) {
    setJogadorEmEdicao(j);
    setModalJogadorAberto(true);
  }

  function salvarJogador(jogador: JogadorDia) {
    setJogadores((atual) => {
      const existe = atual.some((j) => j.id === jogador.id);
      if (existe) {
        return atual.map((j) => (j.id === jogador.id ? jogador : j));
      }
      // novo jogador entra no pool (sem equipe)
      return [...atual, { ...jogador, equipeId: null }];
    });

    setModalJogadorAberto(false);
    setJogadorEmEdicao(null);
  }

  function removerJogador(idJogador: number) {
    setJogadores((atual) => atual.filter((j) => j.id !== idJogador));
  }

  // ---------- equipe ----------

  function abrirNovaEquipe() {
    setEquipeEmEdicao(null);
    setModalEquipeAberto(true);
  }

  function abrirEdicaoEquipe(equipe: EquipeDia) {
    setEquipeEmEdicao(equipe);
    setModalEquipeAberto(true);
  }

  function salvarEquipe(data: EquipeFormData) {
    if (equipeEmEdicao) {
      setEquipes((atual) =>
        atual.map((eq) =>
          eq.id === equipeEmEdicao.id
            ? { ...eq, nome: data.nome, corCamisa: data.corCamisa }
            : eq
        )
      );
      setEquipeEmEdicao(null);
    } else {
      const nova: EquipeDia = {
        id: Date.now(),
        nome: data.nome,
        corCamisa: data.corCamisa,
      };
      setEquipes((atual) => [...atual, nova]);
    }
    setModalEquipeAberto(false);
  }

  function removerEquipe(idEquipe: number) {
    setEquipes((atual) => atual.filter((e) => e.id !== idEquipe));
    // todo jogador dessa equipe volta pro pool
    setJogadores((atual) =>
      atual.map((j) => (j.equipeId === idEquipe ? { ...j, equipeId: null } : j))
    );
  }

  // ---------- drag & drop handlers ----------

  function handleDragStartJogador(idJogador: number) {
    setJogadorArrastandoId(idJogador);
  }

  function handleDragEnd() {
    setJogadorArrastandoId(null);
  }

  function handleDropNoPool() {
    if (jogadorArrastandoId == null) return;
    atribuirJogadorAEquipe(jogadorArrastandoId, null);
    setJogadorArrastandoId(null);
  }

  function handleDropNoTime(idEquipe: number) {
    if (jogadorArrastandoId == null) return;
    atribuirJogadorAEquipe(jogadorArrastandoId, idEquipe);
    setJogadorArrastandoId(null);
  }

  return (
    <div style={{ display: "flex", gap: 16 }}>
      {/* ESQUERDA: Pool de jogadores */}
      <aside
        style={{
          width: 260,
          borderRight: "1px solid #ddd",
          paddingRight: 12,
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropNoPool}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <h3 style={{ margin: 0 }}>Jogadores disponíveis</h3>
          <button style={{ fontSize: 12 }} onClick={abrirNovoJogador}>
            + Novo
          </button>
        </div>

        {jogadoresNoPool.length === 0 ? (
          <p style={{ fontSize: 12 }}>Nenhum jogador disponível no pool.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {jogadoresNoPool.map((j) => (
              <li
                key={j.id}
                style={{
                  marginBottom: 6,
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  padding: "6px 8px",
                  background:
                    jogadorArrastandoId === j.id ? "#e2e8f0" : "#ffffff",
                }}
                draggable
                onDragStart={() => handleDragStartJogador(j.id)}
                onDragEnd={handleDragEnd}
              >
                <div style={{ fontWeight: 500 }}>
                  {j.nome}
                  {j.apelido && (
                    <span style={{ fontSize: 11, color: "#666" }}>
                      {" "}
                      ({j.apelido})
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#555" }}>
                  {statusLabel(j.status)}
                </div>

                <div style={{ marginTop: 4 }}>
                  <label style={{ fontSize: 11 }}>Adicionar ao time: </label>
                  <select
                    defaultValue=""
                    onChange={(e) =>
                      atribuirJogadorAEquipe(
                        j.id,
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  >
                    <option value="">Selecione...</option>
                    {equipes.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginTop: 4 }}>
                  <button
                    style={{ fontSize: 11, marginRight: 6 }}
                    onClick={() => abrirEdicaoJogador(j)}
                  >
                    Editar
                  </button>
                  <button
                    style={{ fontSize: 11, color: "red" }}
                    onClick={() => removerJogador(j.id)}
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* DIREITA: Times com seus jogadores */}
      <section style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <h3 style={{ margin: 0 }}>Times</h3>
          <button style={{ fontSize: 12 }} onClick={abrirNovaEquipe}>
            + Nova equipe
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {equipes.map((equipe) => {
            const jogadoresEq = jogadoresDaEquipe(equipe.id);
            return (
              <div
                key={equipe.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 10,
                  background: "#fff",
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropNoTime(equipe.id)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <div>
                    <strong>{equipe.nome}</strong>
                    {equipe.corCamisa && (
                      <div style={{ fontSize: 11, color: "#555" }}>
                        Camisa: {equipe.corCamisa}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#777" }}>
                      {jogadoresEq.length} jogadores
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <button
                      style={{ fontSize: 11, marginBottom: 4 }}
                      onClick={() => abrirEdicaoEquipe(equipe)}
                    >
                      Editar
                    </button>
                    <br />
                    <button
                      style={{ fontSize: 11, color: "red" }}
                      onClick={() => removerEquipe(equipe.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>

                {jogadoresEq.length === 0 ? (
                  <p style={{ fontSize: 12 }}>Sem jogadores neste time.</p>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 12,
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            textAlign: "left",
                            borderBottom: "1px solid #ddd",
                            paddingBottom: 4,
                          }}
                        >
                          Jogador
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            borderBottom: "1px solid #ddd",
                            paddingBottom: 4,
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            borderBottom: "1px solid #ddd",
                            paddingBottom: 4,
                          }}
                        >
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {jogadoresEq.map((j) => (
                        <tr
                          key={j.id}
                          draggable
                          onDragStart={() => handleDragStartJogador(j.id)}
                          onDragEnd={handleDragEnd}
                          style={{
                            background:
                              jogadorArrastandoId === j.id
                                ? "#e2e8f0"
                                : "transparent",
                          }}
                        >
                          <td
                            style={{
                              padding: "4px 2px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {j.nome}
                            {j.apelido && (
                              <span
                                style={{ fontSize: 11, color: "#666" }}
                              >{` (${j.apelido})`}</span>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "4px 2px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {statusLabel(j.status)}
                          </td>
                          <td
                            style={{
                              padding: "4px 2px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            <button
                              style={{ fontSize: 11, marginRight: 4 }}
                              onClick={() => abrirEdicaoJogador(j)}
                            >
                              Editar
                            </button>
                            <button
                              style={{ fontSize: 11, marginRight: 4 }}
                              onClick={() =>
                                atribuirJogadorAEquipe(j.id, null)
                              }
                            >
                              ↩ Pool
                            </button>
                            <button
                              style={{ fontSize: 11, color: "red" }}
                              onClick={() => removerJogador(j.id)}
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal Jogador */}
      <Modal
        open={modalJogadorAberto}
        title={jogadorEmEdicao ? "Editar jogador" : "Novo jogador"}
        onClose={() => {
          setModalJogadorAberto(false);
          setJogadorEmEdicao(null);
        }}
      >
        <FormJogador
          onSave={salvarJogador}
          initialData={jogadorEmEdicao ?? undefined}
        />
      </Modal>

      {/* Modal Equipe */}
      <Modal
        open={modalEquipeAberto}
        title={equipeEmEdicao ? "Editar equipe" : "Nova equipe"}
        onClose={() => {
          setModalEquipeAberto(false);
          setEquipeEmEdicao(null);
        }}
      >
        <FormEquipe
          onSave={salvarEquipe}
          initialData={
            equipeEmEdicao
              ? { nome: equipeEmEdicao.nome, corCamisa: equipeEmEdicao.corCamisa }
              : undefined
          }
        />
      </Modal>
    </div>
  );
}
