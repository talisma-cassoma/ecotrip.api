// src/socket/types.ts
import { EventEmitter } from 'events';

export type ControllerEventsMap = Map<string | symbol, (...args: any[]) => void>;

export interface RouteConfigItem {
  namespace: string;
  events: ControllerEventsMap;
  eventEmitter: EventEmitter;
}

export type RouteConfig = RouteConfigItem[];
