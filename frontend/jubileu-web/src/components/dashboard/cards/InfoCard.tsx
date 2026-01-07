import { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  to?: string;
  onClick?: () => void;
};

export default function InfoCard({ title, value, subtitle, icon, to, onClick }: Props) {
  const content = (
    <div className="card h-100 shadow-sm border-0" role="article">
      <div className="card-body d-flex flex-column gap-2">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <p className="text-uppercase text-muted mb-1" style={{ letterSpacing: 0.3 }}>
              {title}
            </p>
            <h4 className="mb-0 fw-bold">{value}</h4>
          </div>
          {icon && <div className="text-primary fs-4">{icon}</div>}
        </div>
        {subtitle && <small className="text-muted">{subtitle}</small>}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="text-decoration-none text-reset" onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className="p-0 border-0 bg-transparent text-start w-100" onClick={onClick}>
      {content}
    </button>
  );
}
