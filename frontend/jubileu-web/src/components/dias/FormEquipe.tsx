import { useState } from "react";

export type EquipeFormData = {
  nome: string;
  corCamisa?: string;
};

type Props = {
  initialData?: EquipeFormData;
  onSave: (data: EquipeFormData) => void;
};

export default function FormEquipe({ initialData, onSave }: Props) {
  const [nome, setNome] = useState(initialData?.nome ?? "");
  const [corCamisa, setCorCamisa] = useState(initialData?.corCamisa ?? "");

  function salvar() {
    if (!nome.trim()) {
      alert("Nome da equipe é obrigatório.");
      return;
    }

    onSave({
      nome,
      corCamisa: corCamisa || undefined,
    });
  }

  return (
    <div>
      <label>Nome da equipe</label>
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={{ width: "100%", marginBottom: 12 }}
      />

      <label>Cor da camisa (livre: Azul, Laranja, Verde...)</label>
      <input
        type="text"
        value={corCamisa}
        onChange={(e) => setCorCamisa(e.target.value)}
        style={{ width: "100%", marginBottom: 20 }}
      />

      <button onClick={salvar} style={{ width: "100%" }}>
        {initialData ? "Salvar equipe" : "Criar equipe"}
      </button>
    </div>
  );
}
