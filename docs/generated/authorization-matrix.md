# Matriz de autorizacao HTTP

> Gerado por `python3 scripts/docs/generate_authorization_matrix.py` a partir de
> `backend/jubileu-api-fastapi/app/modules/auth/policy.py`. Nao editar manualmente.

| Metodo | Path | Politica | Papeis | CSRF |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | `public` | Anonimo | Somente refresh exige CSRF proprio |
| `POST` | `/api/auth/logout` | `self_service` | admin, treinador, auxiliar, user; somente identidade propria | Cookie: sim; Bearer: nao |
| `GET` | `/api/auth/me` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `POST` | `/api/auth/refresh` | `public` | Anonimo | Somente refresh exige CSRF proprio |
| `GET` | `/api/dashboards/estatisticas/visao-geral` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `GET` | `/api/dashboards/jogadores/ranking` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `GET` | `/api/dashboards/jogadores/resumo` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `GET` | `/api/dashboards/partidas/lista` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `GET` | `/api/dashboards/partidas/resumo` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `GET` | `/api/dashboards/partidas/serie-por-dia` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `GET` | `/api/dias` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `GET` | `/api/dias/{data_iso}` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `POST` | `/api/dias/{data_iso}/eventos` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `DELETE` | `/api/dias/{data_iso}/eventos/{evento_id}` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `GET` | `/api/dias/{data_iso}/eventos/{evento_id}` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `PUT` | `/api/dias/{data_iso}/eventos/{evento_id}/confirmar-presencas` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `GET` | `/api/dias/{data_iso}/eventos/{evento_id}/estado` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `GET` | `/api/dias/{data_iso}/eventos/{evento_id}/estado-equipes` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `PUT` | `/api/dias/{data_iso}/eventos/{evento_id}/estado-equipes` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `PUT` | `/api/dias/{data_iso}/eventos/{evento_id}/jogadores/{jogador_evento_id}/status` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `PUT` | `/api/dias/{data_iso}/eventos/{evento_id}/jogadores/{jogador_evento_id}/time` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `GET` | `/api/dias/{data_iso}/eventos/{evento_id}/partidas` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `POST` | `/api/dias/{data_iso}/eventos/{evento_id}/partidas` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `DELETE` | `/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `PUT` | `/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `POST` | `/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/end` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `PUT` | `/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/jogadores/{jogador_evento_id}/stats` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `POST` | `/api/dias/{data_iso}/eventos/{evento_id}/partidas/{partida_id}/start` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `POST` | `/api/dias/{data_iso}/eventos/{evento_id}/times` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `DELETE` | `/api/dias/{data_iso}/eventos/{evento_id}/times/{time_id}` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `GET` | `/api/dias/{data_iso}/eventos/{evento_id}/workspace` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `POST` | `/api/eventos/{evento_id}/cancel` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `DELETE` | `/api/eventos/{evento_id}/checkin` | `self_service` | admin, treinador, auxiliar, user; somente identidade propria | Cookie: sim; Bearer: nao |
| `POST` | `/api/eventos/{evento_id}/checkin` | `self_service` | admin, treinador, auxiliar, user; somente identidade propria | Cookie: sim; Bearer: nao |
| `POST` | `/api/eventos/{evento_id}/end` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `GET` | `/api/eventos/{evento_id}/lances` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `GET` | `/api/eventos/{evento_id}/participants` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `POST` | `/api/eventos/{evento_id}/participants/{jogador_id}/checkin` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `POST` | `/api/eventos/{evento_id}/partidas/proxima` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `POST` | `/api/eventos/{evento_id}/partidas/seed` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `GET` | `/api/eventos/{evento_id}/presentes` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `POST` | `/api/eventos/{evento_id}/rotacao/confirmar-sorteio` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `GET` | `/api/eventos/{evento_id}/rotacao/estado` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `PATCH` | `/api/eventos/{evento_id}/rotacao/estado` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `POST` | `/api/eventos/{evento_id}/rotacao/preview-sorteio` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `DELETE` | `/api/eventos/{evento_id}/rsvp` | `self_service` | admin, treinador, auxiliar, user; somente identidade propria | Cookie: sim; Bearer: nao |
| `POST` | `/api/eventos/{evento_id}/rsvp` | `self_service` | admin, treinador, auxiliar, user; somente identidade propria | Cookie: sim; Bearer: nao |
| `POST` | `/api/eventos/{evento_id}/start` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `GET` | `/api/health` | `public` | Anonimo | Somente refresh exige CSRF proprio |
| `GET` | `/api/jogadores` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `POST` | `/api/jogadores` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `DELETE` | `/api/jogadores/{jogador_id}` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `GET` | `/api/jogadores/{jogador_id}` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `PUT` | `/api/jogadores/{jogador_id}` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `POST` | `/api/partidas/{partida_id}/lances` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `GET` | `/api/ready` | `public` | Anonimo | Somente refresh exige CSRF proprio |
| `GET` | `/api/turmas` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `POST` | `/api/turmas` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `DELETE` | `/api/turmas/{turma_id}` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `GET` | `/api/turmas/{turma_id}` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `PUT` | `/api/turmas/{turma_id}` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `GET` | `/api/turmas/{turma_id}/jogadores` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `POST` | `/api/turmas/{turma_id}/jogadores` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `DELETE` | `/api/turmas/{turma_id}/jogadores/{jogador_id}` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `GET` | `/api/usuarios/me` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `PUT` | `/api/usuarios/me/jogador` | `operator` | admin, treinador, auxiliar | Cookie: sim; Bearer: nao |
| `GET` | `/api/version` | `authenticated_read` | admin, treinador, auxiliar, user | Nao |
| `GET` | `/health` | `public` | Anonimo | Somente refresh exige CSRF proprio |

Regras: leituras exigem autenticacao; comandos `operator` exigem `admin`, `treinador` ou
`auxiliar`; comandos `self_service` resolvem exclusivamente o vinculo persistido do usuario.
Headers `X-User-*` sao aceitos apenas em development/test e nunca prevalecem sobre cookie ou Bearer.
