/**
 * Process Helper - Unified utility for executing shell commands
 * 
 * Provides cross-platform command execution with streaming output support.
 * Currently uses PowerShell for Windows, with abstractions ready for Unix support.
 */

import type { ExecOptions } from 'child_process';
import { exec, spawn } from 'child_process';
import type * as vscode from 'vscode';

/**
 * Platform types for cross-platform support
 */
export type Platform = 'windows' | 'unix';

/**
 * Package manager types
 */
export type PackageManager = 'npm' | 'pnpm';

/**
 * Result of a process execution
 */
export interface ProcessResult {
  /** Whether the process completed successfully */
  success: boolean;
  /** Standard output from the process */
  stdout: string;
  /** Standard error output from the process */
  stderr: string;
  /** Process exit code */
  exitCode: number;
}

/**
 * Options for process execution
 */
export interface ProcessOptions {
  /** Working directory for the command */
  cwd?: string;
  /** Environment variables to pass */
  env?: Record<string, string>;
  /** Timeout in milliseconds (default: 300000 = 5 minutes) */
  timeout?: number;
  /** Output channel for streaming (optional) */
  outputChannel?: vscode.OutputChannel;
  /** Whether to use npm (default: true) or pnpm */
  packageManager?: PackageManager;
}

/**
 * Stream handler callback for real-time output processing
 */
export type StreamHandler = (type: 'stdout' | 'stderr', data: string) => void;

/**
 * Platform abstraction interface for command execution
 * Allows adding Unix support without changing the public API
 */
export interface ICommandExecutor {
  /**
   * Detects the current platform
   */
  detectPlatform(): Platform;
  
  /**
   * Executes a command and returns the result
   */
  exec(command: string, options?: ProcessOptions): Promise<ProcessResult>;
  
  /**
   * Executes a command with streaming output
   */
  execStream(command: string, options?: ProcessOptions, handler?: StreamHandler): Promise<ProcessResult>;
  
  /**
   * Executes a package manager script
   */
  execPackageManager(script: string, cwd: string, args: string[], options?: ProcessOptions): Promise<ProcessResult>;
}

/**
 * Windows-specific command executor
 * Uses PowerShell for command execution
 */
export class WindowsCommandExecutor implements ICommandExecutor {
  /**
   * Detects the current platform
   */
  detectPlatform(): Platform {
    return 'windows';
  }

  /**
   * Executes a command and returns the result
   */
  async exec(command: string, options?: ProcessOptions): Promise<ProcessResult> {
    const timeout = options?.timeout ?? 300000; // Default 5 minutes
    const cwd = options?.cwd ?? process.cwd();
    
    return new Promise((resolve) => {
      const execOptions: ExecOptions = {
        cwd,
        env: { ...process.env, ...options?.env },
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      };

      exec(command, execOptions, (error: Error | null, stdoutData: string | Buffer, stderrData: string | Buffer) => {
        if (error) {
          // Command failed, but we may still have output
          const errorCode = (error as NodeJS.ErrnoException).code;
          const exitCode = typeof errorCode === 'number' ? errorCode : 1;
          resolve({
            success: false,
            stdout: stdoutData?.toString() ?? '',
            stderr: stderrData?.toString() ?? error.message,
            exitCode,
          });
          return;
        }

        resolve({
          success: true,
          stdout: stdoutData?.toString() ?? '',
          stderr: stderrData?.toString() ?? '',
          exitCode: 0,
        });
      });
    });
  }

  /**
   * Gets current timestamp for log formatting
   * @returns Formatted timestamp string [HH:mm:ss]
   */
  private getTimestamp(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `[${hours}:${minutes}:${seconds}]`;
  }

  /**
   * Executes a command with streaming output using spawn
   */
  async execStream(command: string, options?: ProcessOptions, handler?: StreamHandler): Promise<ProcessResult> {
    const timeout = options?.timeout ?? 300000;
    const cwd = options?.cwd ?? process.cwd();
    const outputChannel = options?.outputChannel;

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let completed = false;
      let timeoutHandle: NodeJS.Timeout | null = null;

      // Use spawn for better streaming control
      const child = spawn(command, [], {
        shell: true,
        cwd,
        env: { ...process.env, ...options?.env },
        stdio: 'pipe',
      });

      // Set up timeout
      timeoutHandle = setTimeout(() => {
        if (!completed) {
          completed = true;
          child.kill('SIGTERM');
          resolve({
            success: false,
            stdout,
            stderr: stderr + '\n[TIMEOUT] Command exceeded timeout',
            exitCode: 124, // Standard timeout exit code
          });
        }
      }, timeout);

      // Helper to write to output channel with timestamp
      const writeToOutput = (text: string) => {
        if (outputChannel) {
          const timestamp = this.getTimestamp();
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.trim()) {
              outputChannel.appendLine(`${timestamp} ${line}`);
            }
          }
        }
      };

      // Handle stdout stream
      child.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        stdout += text;
        handler?.('stdout', text);
        writeToOutput(text);
      });

      // Handle stderr stream
      child.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;
        handler?.('stderr', text);
        writeToOutput(text);
      });

      // Handle process completion
      child.on('close', (code: number) => {
        if (completed) return;
        completed = true;
        if (timeoutHandle) clearTimeout(timeoutHandle);

        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code ?? 1,
        });
      });

      // Handle spawn errors
      child.on('error', (error: Error) => {
        if (completed) return;
        completed = true;
        if (timeoutHandle) clearTimeout(timeoutHandle);

        resolve({
          success: false,
          stdout,
          stderr: error.message,
          exitCode: 1,
        });
      });
    });
  }

  /**
   * Executes a package manager script (npm or pnpm)
   */
  async execPackageManager(script: string, cwd: string, args: string[], options?: ProcessOptions): Promise<ProcessResult> {
    const packageManager = options?.packageManager ?? 'npm';
    const packageArgs = args.length > 0 ? args.join(' ') : '';
    
    // Build command based on package manager
    let command: string;
    if (packageManager === 'pnpm') {
      command = `pnpm ${script} ${packageArgs}`.trim();
    } else {
      command = `npm run ${script} ${packageArgs}`.trim();
    }

    return this.exec(command, { ...options, cwd });
  }
}

/**
 * Unix command executor placeholder
 * Ready for future Unix support without API changes
 */
export class UnixCommandExecutor implements ICommandExecutor {
  /**
   * Detects the current platform
   */
  detectPlatform(): Platform {
    return 'unix';
  }

  /**
   * Executes a command and returns the result
   */
  async exec(command: string, options?: ProcessOptions): Promise<ProcessResult> {
    // Placeholder for Unix implementation
    // Will use bash -c for command execution
    // Suppress unused parameter warnings for future implementation
    void command;
    void options;
    throw new Error('Unix executor not yet implemented');
  }

  /**
   * Executes a command with streaming output
   */
  async execStream(command: string, options?: ProcessOptions, handler?: StreamHandler): Promise<ProcessResult> {
    // Placeholder for Unix implementation
    // Suppress unused parameter warnings for future implementation
    void command;
    void options;
    void handler;
    throw new Error('Unix executor not yet implemented');
  }

  /**
   * Executes a package manager script
   */
  async execPackageManager(script: string, cwd: string, args: string[], options?: ProcessOptions): Promise<ProcessResult> {
    // Placeholder for Unix implementation
    // Suppress unused parameter warnings for future implementation
    void script;
    void cwd;
    void args;
    void options;
    throw new Error('Unix executor not yet implemented');
  }
}

/**
 * Process Helper - Main class for process execution
 * Uses the appropriate executor based on the current platform
 */
export class ProcessHelper {
  /** Current platform executor */
  private static executor: ICommandExecutor | null = null;

  /**
   * Gets the current executor, creating it if necessary
   */
  private static getExecutor(): ICommandExecutor {
    if (!this.executor) {
      // Default to Windows executor
      this.executor = new WindowsCommandExecutor();
    }
    return this.executor;
  }

  /**
   * Detects the current platform
   */
  static detectPlatform(): Platform {
    return this.getExecutor().detectPlatform();
  }

  /**
   * Executes an arbitrary shell command
   * @param command - The command to execute
   * @param options - Execution options
   * @returns Promise resolving to ProcessResult
   */
  static async exec(command: string, options?: ProcessOptions): Promise<ProcessResult> {
    return this.getExecutor().exec(command, options);
  }

  /**
   * Executes a command with streaming output
   * @param command - The command to execute
   * @param options - Execution options
   * @param handler - Optional stream handler for real-time output
   * @returns Promise resolving to ProcessResult
   */
  static async execStream(command: string, options?: ProcessOptions, handler?: StreamHandler): Promise<ProcessResult> {
    return this.getExecutor().execStream(command, options, handler);
  }

  /**
   * Executes an npm or pnpm script in a specified directory
   * @param script - The npm/pnpm script to run (e.g., 'install', 'build', 'dev')
   * @param cwd - The working directory for the command
   * @param args - Additional arguments to pass to the script
   * @param options - Execution options
   * @returns Promise resolving to ProcessResult
   */
  static async execPackageManager(script: string, cwd: string, args: string[] = [], options?: ProcessOptions): Promise<ProcessResult> {
    return this.getExecutor().execPackageManager(script, cwd, args, options);
  }

  /**
   * Runs npm install or pnpm install in a directory
   * @param cwd - The directory to install dependencies in
   * @param options - Execution options
   * @returns Promise resolving to ProcessResult
   */
  static async installDependencies(cwd: string, options?: ProcessOptions): Promise<ProcessResult> {
    const packageManager = options?.packageManager ?? 'npm';
    const timeout = options?.timeout ?? 300000;

    let command: string;
    if (packageManager === 'pnpm') {
      command = 'pnpm install';
    } else {
      command = 'npm install';
    }

    return this.exec(command, { ...options, cwd, timeout });
  }

  /**
   * Runs npm run build or pnpm build in a directory
   * @param cwd - The directory to build in
   * @param options - Execution options
   * @returns Promise resolving to ProcessResult
   */
  static async runBuild(cwd: string, options?: ProcessOptions): Promise<ProcessResult> {
    return this.execPackageManager('build', cwd, [], options);
  }

  /**
   * Runs npm run dev or pnpm dev in a directory
   * Note: This is typically used for long-running processes
   * @param cwd - The directory to run dev server in
   * @param options - Execution options
   * @returns Promise resolving to ProcessResult
   */
  static async runDevServer(cwd: string, options?: ProcessOptions): Promise<ProcessResult> {
    return this.execPackageManager('dev', cwd, [], { ...options, timeout: 0 }); // No timeout for dev server
  }

  /**
   * Sets a custom executor (for testing or platform detection)
   * @param executor - The executor to use
   */
  static setExecutor(executor: ICommandExecutor): void {
    this.executor = executor;
  }

  /**
   * Resets the executor (useful for testing)
   */
  static resetExecutor(): void {
    this.executor = null;
  }
}

/**
 * Error codes for process failures
 */
export enum ProcessErrorCode {
  /** Command not found */
  ENOENT = 'ENOENT',
  /** Command execution timed out */
  ETIMEDOUT = 'ETIMEDOUT',
  /** Execution failure */
  EEXEC = 'EEXEC',
  /** Unknown error */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Gets the error code from a process error
 */
export function getProcessErrorCode(error: unknown): ProcessErrorCode {
  if (error instanceof Error) {
    if (error.message.includes('ENOENT') || error.message.includes('not found')) {
      return ProcessErrorCode.ENOENT;
    }
    if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
      return ProcessErrorCode.ETIMEDOUT;
    }
    if (error.message.includes('EEXEC') || error.message.includes('execution failed')) {
      return ProcessErrorCode.EEXEC;
    }
  }
  return ProcessErrorCode.UNKNOWN;
}