import { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export default function SectionHeader({ title, subtitle, action }: Props) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
      <div>
        <p className="text-muted mb-1 small text-uppercase" style={{ letterSpacing: 0.3 }}>
          {subtitle ?? "Visão geral"}
        </p>
        <h2 className="h4 mb-0">{title}</h2>
      </div>
      {action && <div className="d-flex align-items-center gap-2">{action}</div>}
    </div>
  );
}
