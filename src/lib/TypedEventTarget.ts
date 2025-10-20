export class TypedEventTarget<
  EventMap extends { [K in keyof EventMap]: CustomEvent<any> }
> extends EventTarget {
  constructor() {
    super();
  }

  addEventListener<K extends keyof EventMap>(
    type: K,
    listener: (event: EventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;

  // Fallback overload (required for compatibility)
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void;

  // Implementation (must match the base EventTarget signature!)
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void {
    super.addEventListener(type, listener, options);
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void;

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void {
    super.removeEventListener(type, listener, options);
  }

  dispatchEvent<K extends keyof EventMap>(event: EventMap[K]): boolean;
  dispatchEvent(event: any) {
    return super.dispatchEvent(event);
  }
}
