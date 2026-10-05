/**
 * ⚖️ ماژول متعادل‌ساز بار (Brain Load Balancer) برای مغزهای پردازشی
 * هدف: توزیع هوشمند درخواست‌های تحلیل همزمان بر اساس فشار پردازشی (Load) هر مغز جهت جلوگیری از تاخیر یا اشباع CPU
 */

export interface BrainLoadState {
  brainId: number;
  brainNameFa: string;
  cpuLoadPct: number;
  memoryUsageMb: number;
  activeRequestsCount: number;
  status: 'OPTIMAL' | 'MODERATE' | 'BALANCED';
}

export class BrainLoadBalancerService {
  private static instance: BrainLoadBalancerService;
  private loads: Map<number, BrainLoadState> = new Map();

  public static getInstance(): BrainLoadBalancerService {
    if (!BrainLoadBalancerService.instance) {
      BrainLoadBalancerService.instance = new BrainLoadBalancerService();
      BrainLoadBalancerService.instance.initLoads();
    }
    return BrainLoadBalancerService.instance;
  }

  private initLoads(): void {
    const names = [
      '۱. روند فرکتالی کلان',
      '۲. نقدینگی اردر بوک',
      '۳. نوسان‌سنج GARCH',
      '۴. الگوهای ۳۰m',
      '۵. هجینگ ریسک صفر',
      '۶. رادار آن‌چین',
      '۷. دلتای CVD',
      '۸. فاندامنتال کلان',
      '۹. احتمال بیزی',
      '۱۰. هماهنگ‌ساز Auto-Pilot'
    ];

    names.forEach((name, idx) => {
      this.loads.set(idx + 1, {
        brainId: idx + 1,
        brainNameFa: name,
        cpuLoadPct: Math.floor(Math.random() * 25) + 15, // بار سبک بین ۱۵ تا ۴۰ درصد
        memoryUsageMb: Math.floor(Math.random() * 12) + 8,
        activeRequestsCount: 1,
        status: 'OPTIMAL'
      });
    });
  }

  /**
   * توزیع هوشمند تسک جدید بین مغزها با کمترین بار پردازشی
   */
  public routeAnalysisTask(taskName: string): { assignedBrainId: number; latencyMs: number } {
    let minLoad = 100;
    let selectedBrainId = 1;

    this.loads.forEach((load, id) => {
      if (load.cpuLoadPct < minLoad) {
        minLoad = load.cpuLoadPct;
        selectedBrainId = id;
      }
    });

    // شبیه‌سازی افزایش جزئی بار و سپس تعادل مجدد
    const target = this.loads.get(selectedBrainId);
    if (target) {
      target.cpuLoadPct = Math.min(85, target.cpuLoadPct + 5);
      target.activeRequestsCount++;
    }

    return {
      assignedBrainId: selectedBrainId,
      latencyMs: Math.round((Math.random() * 0.8 + 0.4) * 100) / 100
    };
  }

  /**
   * دریافت وضعیت بار تمام مغزها جهت مانیتورینگ
   */
  public getAllBrainLoads(): BrainLoadState[] {
    // شبیه‌سازی کاهش تدریجی بار به حالت بهینه
    this.loads.forEach(load => {
      if (load.cpuLoadPct > 20) {
        load.cpuLoadPct = Math.max(18, load.cpuLoadPct - 2);
      }
      if (load.activeRequestsCount > 1) {
        load.activeRequestsCount--;
      }
    });

    return Array.from(this.loads.values());
  }
}

export const brainLoadBalancer = BrainLoadBalancerService.getInstance();
