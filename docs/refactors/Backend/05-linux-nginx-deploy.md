Use $jubileu-backend-feature.

Read:
- docs/refactors/relatorio-arquitetura-plano-refatoracao.md
- references/platform-rules.md
- references/delivery.md

Task:
Implement Slice 05 - Linux Deployment Assets.

Goals:
1. Add deployment documentation for Linux host
2. Add NGINX reverse proxy example for frontend + /api
3. Add systemd service example for the API
4. Add HTTPS/Certbot checklist
5. Do not change application behavior unless required for health/config support
6. Keep NGINX as the only public entrypoint

Output:
- docs and infra files
- technical description
- validation checklist