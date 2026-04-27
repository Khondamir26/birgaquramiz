declare global {
  interface Window {
    ymaps: {
      ready: (cb: () => void) => void;
      Map: new (
        el: HTMLElement,
        state: object,
        opts?: object
      ) => {
        geoObjects: { add: (o: object) => void; remove: (o: object) => void };
        setCenter: (c: [number, number], zoom?: number, opts?: object) => void;
        setZoom: (z: number, opts?: object) => void;
        destroy: () => void;
      };
      Placemark: new (
        c: [number, number],
        p: object,
        o: object
      ) => {
        geometry: { setCoordinates: (c: [number, number]) => void };
        options: { set: (k: string, v: unknown) => void };
      };
      Polyline: new (
        c: [number, number][],
        p: object,
        o: object
      ) => {
        geometry: { setCoordinates: (c: [number, number][]) => void };
        options: { set: (k: string, v: unknown) => void };
      };
    };
  }
}

export {};
