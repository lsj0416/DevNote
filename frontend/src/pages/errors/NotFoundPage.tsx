import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="page-wrap not-found-page">
      <p className="eyebrow">404</p>
      <h1>요청한 페이지를 찾을 수 없습니다.</h1>
      <p className="hero-text">
        라우트 골격은 준비되어 있지만 현재 경로는 앱 구조에 연결되어 있지
        않습니다.
      </p>
      <div className="inline-actions">
        <Link className="primary-link" to="/">
          랜딩으로 이동
        </Link>
      </div>
    </main>
  )
}
