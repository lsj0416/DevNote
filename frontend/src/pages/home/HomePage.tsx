import { Link } from 'react-router-dom'
import { GITHUB_LOGIN_URL } from '../../shared/config/auth'

export function HomePage() {
  return (
    <main className="app-shell landing-page">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">DevNote</p>
          <h1>GitHub repo를 넣으면 학습 노트와 블로그 초안이 이어집니다.</h1>
          <p className="hero-text">
            DevNote는 저장소 구조를 분석해 학습 노트와 블로그 초안을 생성하는
            AI 기반 개인 학습 서비스입니다.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href={GITHUB_LOGIN_URL}>
              GitHub 로그인 시작
            </a>
            <Link className="ghost-link" to="/app">
              보호 라우트 확인
            </Link>
            <span className="action-hint">
              백엔드 OAuth 성공 시 `/login/callback`으로 다시 돌아옵니다.
            </span>
          </div>
        </div>

        <aside className="hero-panel" aria-label="서비스 요약">
          <div className="panel-chip">MVP Flow</div>
          <ol className="flow-list">
            <li>GitHub 로그인</li>
            <li>repo URL 입력</li>
            <li>분석 Job 상태 확인</li>
            <li>노트와 블로그 초안 열람</li>
          </ol>
        </aside>
      </section>

      <section className="preview-grid" aria-label="핵심 가치">
        <article className="preview-card">
          <p className="card-label">Input</p>
          <h2>복잡한 저장소도 한 번에 입력</h2>
          <p>
            대시보드에서 GitHub repo URL을 붙여넣고 바로 분석 요청을 시작할 수
            있는 흐름을 준비합니다.
          </p>
        </article>
        <article className="preview-card">
          <p className="card-label">Processing</p>
          <h2>비동기 분석 상태를 안정적으로 표시</h2>
          <p>
            `jobId` 기반 polling 화면을 전제로, 대기와 처리와 완료를 구분해
            보여줄 구조를 다음 Step에서 연결합니다.
          </p>
        </article>
        <article className="preview-card">
          <p className="card-label">Output</p>
          <h2>노트와 블로그 초안으로 자연스럽게 이동</h2>
          <p>
            카드형 요약과 문서형 본문을 함께 제공하는 읽기 경험을 MVP 핵심으로
            둡니다.
          </p>
        </article>
      </section>
    </main>
  )
}
