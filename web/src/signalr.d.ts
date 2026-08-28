declare module '@microsoft/signalr' {
  export enum HubConnectionState { Disconnected='Disconnected', Connecting='Connecting', Connected='Connected', Disconnecting='Disconnecting', Reconnecting='Reconnecting' }
  export class HubConnection {
    state: HubConnectionState;
    start(): Promise<void>; invoke<T=void>(methodName:string,...args:any[]):Promise<T>; on(methodName:string,handler:(...args:any[])=>void):void; onreconnected(handler:()=>void):void;
  }
  export class HubConnectionBuilder { withUrl(url:string):HubConnectionBuilder; withAutomaticReconnect(retryDelays?:number[]):HubConnectionBuilder; build():HubConnection; }
}
