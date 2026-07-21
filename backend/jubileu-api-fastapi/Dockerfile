FROM python:3.12-slim

ARG RELEASE_REF=development
ARG GIT_SHA=unknown
ARG ALEMBIC_EXPECTED_REVISION=0020_auth_sessions_rollback_safe

LABEL org.opencontainers.image.title="Jubileu API" \
      org.opencontainers.image.version=$RELEASE_REF \
      org.opencontainers.image.revision=$GIT_SHA \
      io.jubileu.alembic.revision=$ALEMBIC_EXPECTED_REVISION

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV RELEASE_REF=$RELEASE_REF
ENV GIT_SHA=$GIT_SHA
ENV ALEMBIC_EXPECTED_REVISION=$ALEMBIC_EXPECTED_REVISION

COPY requirements.txt .

RUN pip install --no-cache-dir --timeout 120 -r requirements.txt

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
