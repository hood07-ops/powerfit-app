import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('PowerFit UI error:', error, info)
  }

  retry = () => {
    this.setState({ hasError: false, error: null })
  }

  reload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-5">
        <div className="w-full max-w-xl rounded-3xl border border-red-600 bg-zinc-950 p-6 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-400">PowerFit 360</p>
          <h1 className="mt-2 text-3xl font-black">La pantalla tuvo un problema</h1>
          <p className="mt-3 text-zinc-300">
            Tus datos no se han borrado. Puedes intentar abrir nuevamente esta vista o recargar la app.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={this.retry} className="rounded-2xl bg-zinc-800 px-5 py-4 font-black hover:bg-zinc-700">
              Intentar de nuevo
            </button>
            <button type="button" onClick={this.reload} className="rounded-2xl bg-red-600 px-5 py-4 font-black hover:bg-red-700">
              Recargar PowerFit
            </button>
          </div>
          {import.meta.env.DEV && this.state.error?.message && (
            <pre className="mt-5 max-h-40 overflow-auto rounded-2xl bg-black p-4 text-xs text-red-300">
              {this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
