import { describe, it, expect } from 'vitest';
import { SlidevLauncher } from '../../src/launchers/SlidevLauncher';

describe('SlidevLauncher', () => {
  describe('utility methods', () => {
    it('should detect available port', async () => {
      const launcher = new SlidevLauncher();

      const port = await launcher.findAvailablePort(3030);
      expect(port).toBeGreaterThanOrEqual(3030);
      expect(port).toBeLessThan(3130);
    });

    it('should return false when stopping without process', async () => {
      const launcher = new SlidevLauncher();
      const stopped = await launcher.stop();
      expect(stopped).toBe(false);
    });

    it('should return false for isRunning when no process', () => {
      const launcher = new SlidevLauncher();
      expect(launcher.isRunning()).toBe(false);
    });

    it('should return null for getUrl when not launched', () => {
      const launcher = new SlidevLauncher();
      expect(launcher.getUrl()).toBe(null);
    });
  });

  // 実際のSlidev起動テストは統合テストとして別ファイルで実行
  // (ネットワークアクセスと時間がかかるため)
});
