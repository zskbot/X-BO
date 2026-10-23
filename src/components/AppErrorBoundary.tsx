import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep diagnostics in the browser console without exposing secrets in the UI.
    console.error('X-BO UI render error:', error, info.componentStack);
  }

  private reload = () => window.location.reload();

  render() {
    if (this.state.hasError) {
      return (
        <main
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '24px',
            background: '#05070f',
            color: '#f3f5fb',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          <section style={{ width: 'min(100%, 560px)', border: '1px solid #272b38', padding: '24px', background: '#0a0d16' }}>
            <p style={{ color: '#a5b4fc', fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase' }}>X-BO / UI RECOVERY</p>
            <h1 style={{ margin: '12px 0', fontSize: '24px', fontWeight: 700 }}>Không thể hiển thị giao diện</h1>
            <p style={{ color: '#aab0c0', lineHeight: 1.7, fontSize: '14px' }}>
              Ứng dụng gặp lỗi khi dựng giao diện. Tải lại trang để thử khôi phục. Nếu lỗi tiếp tục, hãy kiểm tra Console trong trình duyệt để xem chi tiết.
            </p>
            <button
              type="button"
              onClick={this.reload}
              style={{ marginTop: '16px', padding: '10px 14px', background: '#f3f5fb', color: '#05070f', border: 0, fontWeight: 700, cursor: 'pointer' }}
            >
              Tải lại trang
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
