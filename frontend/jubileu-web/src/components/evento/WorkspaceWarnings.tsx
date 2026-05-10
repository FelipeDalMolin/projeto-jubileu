import type { WorkspaceEventoWarning } from "../../types/workspaceEvento";

type Props = {
  warnings: WorkspaceEventoWarning[];
};

export default function WorkspaceWarnings({ warnings }: Props) {
  if (!warnings.length) return null;

  return (
    <div className="mb-3">
      {warnings.map((w) => (
        <div
          key={`${w.code}-${w.message}`}
          className={`alert py-2 mb-2 ${
            w.severity === "error"
              ? "alert-danger"
              : w.severity === "warning"
                ? "alert-warning"
                : "alert-info"
          }`}
        >
          {w.message}
        </div>
      ))}
    </div>
  );
}
