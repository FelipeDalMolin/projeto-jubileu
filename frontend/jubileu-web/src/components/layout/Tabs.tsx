import { useState } from "react";

type TabItem = {
  id: string;
  titulo: string;
  conteudo: React.ReactNode;
};

type Props = {
  tabs: TabItem[];
};

export default function Tabs({ tabs }: Props) {
  const [ativa, setAtiva] = useState(tabs[0]?.id ?? "");

  if (!tabs.length) {
    return null;
  }

  return (
    <div>
      {/* Cabeçalho das abas */}
      <div style={{ display: "flex", borderBottom: "1px solid #ddd" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAtiva(tab.id)}
            style={{
              padding: "10px 16px",
              border: "none",
              borderBottom:
                ativa === tab.id ? "3px solid #007bff" : "3px solid transparent",
              background: "none",
              cursor: "pointer",
              fontWeight: ativa === tab.id ? "bold" : "normal",
            }}
          >
            {tab.titulo}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={{ padding: 20 }}>
        {tabs.find((tab) => tab.id === ativa)?.conteudo}
      </div>
    </div>
  );
}
