import { assignWithoutNull } from './utils';

export enum LogLevel {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  MUTE = 'MUTE',
}

const logLevelOrder = Object.fromEntries(Object.values(LogLevel).map((val, index) => [val, index]));

export interface Log {
  level: LogLevel;
  tag: string;
  msg: string;
  attr: object & { error?: any };
  // context: object;
  at: Date;
}

export type LoggerTransportFn = (log: Log) => unknown;

export interface LoggerOptions {
  minLevel: LogLevel;
  defaultAttr: object;
  transports: LoggerTransportFn[];
}

export class Logger {
  public readonly options: LoggerOptions;

  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = assignWithoutNull(
      {
        minLevel: LogLevel.TRACE,
        defaultAttr: {},
        transports: [defaultLoggerTransport(true)],
      },
      options,
    );
  }

  private log(level: LogLevel, tag: string, msg: string, attr: object) {
    if (logLevelOrder[level] < logLevelOrder[this.options.minLevel]) {
      return;
    }
    const log: Log = {
      level,
      tag,
      msg,
      attr: { ...this.options.defaultAttr, ...attr },
      // context: this.context.getStore() ?? {},
      at: new Date(),
    };
    this.options.transports.forEach((transport) => transport(log));
  }

  trace(tag: string, msg: string, attr: object = {}) {
    this.log(LogLevel.TRACE, tag, msg, attr);
  }

  debug(tag: string, msg: string, attr: object = {}) {
    this.log(LogLevel.DEBUG, tag, msg, attr);
  }

  info(tag: string, msg: string, attr: object = {}) {
    this.log(LogLevel.INFO, tag, msg, attr);
  }

  warn(tag: string, msg: string, attr: object = {}) {
    this.log(LogLevel.WARN, tag, msg, attr);
  }

  error(tag: string, msg: string, errorOrAttr?: Error | string | object, optionalAttr: object = {}) {
    const realAttr =
      typeof errorOrAttr === 'string' || errorOrAttr instanceof Error
        ? { error: errorOrAttr, ...optionalAttr }
        : (errorOrAttr ?? {});

    this.log(LogLevel.ERROR, tag, msg, realAttr);
  }

  with(tag: string, defaultAttr: object = {}): ChildLogger {
    return new ChildLogger(tag, { ...this.options, defaultAttr });
  }
}

export class ChildLogger {
  private readonly logger: Logger;

  constructor(
    private tag: string,
    options: Partial<LoggerOptions>,
  ) {
    this.logger = new Logger(options);
  }

  trace(msg: string, attr: object = {}) {
    this.logger.trace(this.tag, msg, attr);
  }

  debug(msg: string, attr: object = {}) {
    this.logger.debug(this.tag, msg, attr);
  }

  info(msg: string, attr: object = {}) {
    this.logger.info(this.tag, msg, attr);
  }

  warn(msg: string, attr: object = {}) {
    this.logger.warn(this.tag, msg, attr);
  }

  error(msg: string, errorOrAttr?: Error | string | object, optionalAttr: object = {}) {
    this.logger.error(this.tag, msg, errorOrAttr, optionalAttr);
  }
}

const gray = (str: string) => `\x1b[90m${str}\x1b[0m`;
const yellow = (str: string) => `\x1b[33m${str}\x1b[0m`;
const red = (str: string) => `\x1b[31m${str}\x1b[0m`;

const MAP_LEVEL_TO_COLOR: { [level in LogLevel]: string } = {
  [LogLevel.TRACE]: gray('TRACE'),
  [LogLevel.INFO]: 'INFO ',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.WARN]: yellow('WARN '),
  [LogLevel.ERROR]: red('ERROR'),
  [LogLevel.MUTE]: '',
};

export const defaultLoggerTransport = (pretty: boolean): LoggerTransportFn => {
  if (pretty) {
    return function prettyLog({ level, tag, msg, attr, at }: Log) {
      const date = at.toISOString().replace('T', ' ');
      const attrs = Object.entries(attr)
        .filter(([k]) => k !== 'error')
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(' ');

      // const ctx = Object.entries(context)
      //   .map(([k, v]) => `${k}=${v}`)
      //   .join(' ');
      // const ctxText = ctx.length > 0 ? gray(` [${ctx}]`) : '';

      // @ts-ignore
      const extra = attr.error ? prettyError(attr.error) : '';
      return console.log(`${gray(date)} ${MAP_LEVEL_TO_COLOR[level]} │ ${tag}: ${msg} ${attrs}${extra}`);
    };
  }
  return function jsonLog({ level, tag, msg, attr, at }: Log) {
    const attrsWithPrettyError = { ...attr };
    if (attr.error) {
      attrsWithPrettyError.error = prettyError(attr.error);
    }
    console.log(JSON.stringify({ at: at.toISOString(), level, tag, msg, ...attrsWithPrettyError }));
  };
};

const prettyError = (err: Error | string) =>
  '\n' +
  (err instanceof Error && err.stack
    ? err.stack?.slice(0, err.stack.lastIndexOf('\n    at Module._compile'))
    : err instanceof Error
      ? err.message
      : String(err));

export const log = new Logger({
  minLevel: LogLevel.ERROR,
});
