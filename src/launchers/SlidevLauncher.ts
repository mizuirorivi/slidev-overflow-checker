import { spawn, ChildProcess } from 'child_process';
import { createServer } from 'net';

export interface LaunchOptions {
  port?: number;
  timeout?: number;
}

/**
 * Class for auto-launching and managing Slidev process
 */
export class SlidevLauncher {
  private process?: ChildProcess;
  private port?: number;

  /**
   * Launch Slidev
   */
  async launch(slidesPath: string, options: LaunchOptions = {}): Promise<string> {
    const timeout = options.timeout ?? 30000;
    const port = options.port ?? (await this.findAvailablePort(3030));

    this.port = port;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.stop();
        reject(new Error(`Slidev failed to start within ${timeout}ms`));
      }, timeout);

      // Spawn Slidev
      this.process = spawn('npx', ['@slidev/cli', slidesPath, '--port', port.toString(), '--open', 'false'], {
        stdio: 'pipe',
        shell: true,
      });

      // Monitor stdout to detect URL
      this.process.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log('[Slidev]', output.trim());

        // Detect URL pattern (supports multiple patterns)
        const urlMatch = output.match(/http:\/\/(?:localhost|127\.0\.0\.1):(\d+)/) ||
                        output.match(/Local:\s+http:\/\/(?:localhost|127\.0\.0\.1):(\d+)/) ||
                        output.match(/ready in \d+ms/) ||  // Vite startup completion message
                        output.match(/Shortcuts/);  // Slidev shortcuts display
        if (urlMatch) {
          clearTimeout(timeoutId);
          const url = `http://localhost:${port}`;
          resolve(url);
        }
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        console.error('[Slidev Error]', data.toString().trim());
      });

      this.process.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to start Slidev: ${error.message}`));
      });

      this.process.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          clearTimeout(timeoutId);
          reject(new Error(`Slidev exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Stop Slidev process
   */
  async stop(): Promise<boolean> {
    if (!this.process) {
      return false;
    }

    return new Promise((resolve) => {
      const killTimeout = setTimeout(() => {
        // Force kill
        this.process?.kill('SIGKILL');
        resolve(true);
      }, 5000);

      this.process?.on('exit', () => {
        clearTimeout(killTimeout);
        this.process = undefined;
        resolve(true);
      });

      // Terminate process
      this.process?.kill('SIGTERM');
    });
  }

  /**
   * Find available port
   */
  async findAvailablePort(startPort: number): Promise<number> {
    let port = startPort;

    while (port < startPort + 100) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
      port++;
    }

    throw new Error(`No available port found in range ${startPort}-${startPort + 100}`);
  }

  /**
   * Check if port is available
   */
  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = createServer();

      server.once('error', () => {
        resolve(false);
      });

      server.once('listening', () => {
        server.close(() => {
          resolve(true);
        });
      });

      server.listen(port);
    });
  }

  /**
   * Check if process is running
   */
  isRunning(): boolean {
    return this.process !== undefined && !this.process.killed;
  }

  /**
   * Get launched URL
   */
  getUrl(): string | null {
    return this.port ? `http://localhost:${this.port}` : null;
  }
}
