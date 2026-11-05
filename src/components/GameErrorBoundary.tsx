import React from 'react';

interface Props {
  children: React.ReactNode;
  onExit?: () => void;
  gameName?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class GameErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Game crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div
            className="max-w-md w-full text-center rounded-3xl p-8"
            style={{
              background: 'linear-gradient(160deg, rgba(20,20,35,0.96), rgba(10,10,20,0.98))',
              border: '1px solid rgba(255,107,157,0.4)',
            }}
          >
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#ff6b9d' }}>
              {this.props.gameName || '游戏'}运行出错
            </h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
              已捕获异常，你可以重新进入或返回首页。
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, message: '' })}
                className="px-6 py-3 rounded-xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #a855f7)' }}
              >
                重试
              </button>
              <button
                onClick={this.props.onExit}
                className="px-6 py-3 rounded-xl font-bold"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.14)' }}
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
