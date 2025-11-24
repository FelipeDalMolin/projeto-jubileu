import { useState } from "react";
import type { JogadorDia } from "../../types/dia";

type Props = {
  onSave: (jogador: JogadorDia) => void;
  initialData?: JogadorDia;
};

export default function FormJogador({ onSave, initialData }: Props) {
  const [nome, setNome] = useState(initialData?.nome ?? "");
  const [apelido, setApelido] = useState(initialData?.apelido ?? "");
  const [status, setStatus] = useState<JogadorDia["status"]>(
    initialData?.status ?? "presente"
  );

  function salvar() {
    if (!nome.trim()) {
      alert("O nome é obrigatório.");
      return;
    }

    onSave({
      id: initialData?.id ?? Date.now(),
      nome,
      apelido: apelido || undefined,
      status,
      // mantém equipeId se estiver editando, ou deixa como undefined (fica no pool)
      equipeId: initialData?.equipeId ?? null,
    });
  }

  return (
    <div>
      <label>Nome</label>
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={{ width: "100%", marginBottom: 12 }}
      />

      <label>Apelido (opcional)</label>
      <input
        type="text"
        value={apelido}
        onChange={(e) => setApelido(e.target.value)}
        style={{ width: "100%", marginBottom: 12 }}
      />

      <label>Status</label>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as JogadorDia["status"])}
        style={{ width: "100%", marginBottom: 20 }}
      >
        <option value="presente">Presente</option>
        <option value="faltou">Faltou</option>
        <option value="coringa">Coringa</option>
        <option value="so_treinou">Só treinou</option>
      </select>

      <button onClick={salvar} style={{ width: "100%" }}>
        {initialData ? "Salvar alterações" : "Salvar jogador"}
      </button>
    </div>
  );
}
