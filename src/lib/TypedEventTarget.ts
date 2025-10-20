export class TypedEventTarget<
  EventMap extends { [K in keyof EventMap]: CustomEvent<any> }
> extends EventTarget {
  constructor() {
    super();
  }

  // Implementation signature
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
  ): void {
    super.removeEventListener(type, listener, options);
  }

  dispatchEvent(event: Event): boolean {
    return super.dispatchEvent(event);
  }
}
