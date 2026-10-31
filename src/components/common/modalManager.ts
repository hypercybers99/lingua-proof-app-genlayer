type ModalCloseHandler = () => void;

interface ModalStackEntry {
  id: string;
  onClose: ModalCloseHandler;
}

class ModalManager {
  private stack: ModalStackEntry[] = [];
  private keydownListenerAttached = false;

  public register(id: string, onClose: ModalCloseHandler): () => void {
    this.stack.push({ id, onClose });
    this.updateBodyScroll();

    if (!this.keydownListenerAttached && typeof window !== "undefined") {
      window.addEventListener("keydown", this.handleGlobalKeyDown);
      this.keydownListenerAttached = true;
    }

    return () => {
      this.unregister(id);
    };
  }

  public unregister(id: string): void {
    this.stack = this.stack.filter((m) => m.id !== id);
    this.updateBodyScroll();

    if (this.stack.length === 0 && this.keydownListenerAttached && typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleGlobalKeyDown);
      this.keydownListenerAttached = false;
    }
  }

  public isTopModal(id: string): boolean {
    if (this.stack.length === 0) return false;
    return this.stack[this.stack.length - 1].id === id;
  }

  public closeTopModal(): void {
    if (this.stack.length > 0) {
      const top = this.stack.pop();
      this.updateBodyScroll();
      top?.onClose();
    }
  }

  private handleGlobalKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape" && this.stack.length > 0) {
      e.preventDefault();
      this.closeTopModal();
    }
  };

  private updateBodyScroll(): void {
    if (typeof document === "undefined") return;
    if (this.stack.length > 0) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }
}

export const modalManager = new ModalManager();
