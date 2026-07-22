def __getattr__(name):
    if name == "rag_bp":
        from .routes import rag_bp

        return rag_bp
    raise AttributeError(name)


__all__ = ["rag_bp"]
