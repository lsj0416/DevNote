# DevNote Infra

> 로컬 개발에 필요한 PostgreSQL, Redis 등 공통 인프라 실행 설정

## Overview

현재 [docker-compose.yml](/Users/sejong/Desktop/Project/devnote/infra/docker-compose.yml)은 백엔드 로컬 개발용 데이터 저장소를 실행합니다.

포함 서비스:

- PostgreSQL 16
- Redis 7

## Run

`infra/` 폴더 안에서 실행하는 방식을 기준으로 사용합니다.

```bash
cd infra
docker compose up -d
```

중지:

```bash
cd infra
docker compose down
```

볼륨까지 삭제:

```bash
cd infra
docker compose down -v
```

루트에서 직접 실행하고 싶다면 아래처럼 `-f` 옵션을 사용하면 됩니다.

```bash
docker compose -f infra/docker-compose.yml up -d
```

## Ports

- PostgreSQL: `5432`
- Redis: `6380` -> container `6379`

## Notes

- compose 프로젝트 이름은 `devnote-local`로 고정됩니다.
- 백엔드 로컬 설정은 [application-local.yml](/Users/sejong/Desktop/Project/devnote/backend/src/main/resources/application-local.yml) 기준 `localhost:5432`, `localhost:6380`를 사용합니다.
- 백엔드 앱 컨테이너는 아직 compose에 포함하지 않았습니다. 현재 구성은 개발 편의상 DB/Redis만 담당합니다.
