import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit, HostListener, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { DevOpsService } from '../../services/devops.service';

@Component({
  selector: 'app-log-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-2xl flex flex-col">
      <div class="flex items-center gap-4 mb-4 text-slate-400 text-xs font-mono uppercase tracking-widest border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <i class="bi bi-activity text-emerald-500"></i>
          <span>Precision-Log-Stream: {{ containerId }}</span>
        </div>
        <div class="ml-auto flex items-center gap-4">
          <button (click)="clearLogs()" class="hover:text-slate-200 transition-colors flex items-center gap-1">
             <i class="bi bi-eraser"></i> Clear
          </button>
          <div class="h-3 w-px bg-slate-700"></div>
          <span class="flex items-center gap-2">
            <div [class]="statusColor()" class="w-1.5 h-1.5 rounded-full shadow-[0_0_8px] shadow-current"></div>
            {{ statusText() }}
          </span>
        </div>
      </div>
      <!-- Terminal Container -->
      <div #terminalContainer class="flex-1 w-full min-h-[600px] rounded-lg overflow-hidden"></div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    ::ng-deep .xterm { padding: 12px; height: 100%; }
    ::ng-deep .xterm-viewport { overflow-y: auto !important; }
  `]
})
export class LogViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('terminalContainer') terminalContainer!: ElementRef;
  
  statusText = signal('Initializing...');
  statusColor = signal('bg-orange-500');
  containerId!: string;

  private term!: Terminal;
  private fitAddon = new FitAddon();
  private socket?: WebSocket;

  constructor(
    private devOpsService: DevOpsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.containerId = this.route.snapshot.params['containerId'];
  }

  ngAfterViewInit(): void {
    this.initTerminal();
  }

  ngOnDestroy(): void {
    this.socket?.close();
    this.term?.dispose();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.fitAddon.fit();
  }

  private initTerminal(): void {
    this.term = new Terminal({
      cursorBlink: false,
      disableStdin: true, // Output only for logs
      scrollback: 5000,
      theme: {
        background: '#020617',
        foreground: '#e2e8f0',
        cursor: '#6366f1'
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 13,
      allowProposedApi: true
    });

    this.term.loadAddon(this.fitAddon);
    this.term.open(this.terminalContainer.nativeElement);
    this.fitAddon.fit();

    this.connectWebSocket();
  }

  private connectWebSocket(): void {
    const url = this.devOpsService.getLogStreamUrl(this.containerId);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.statusText.set('Live Streaming');
      this.statusColor.set('bg-emerald-500');
      this.term.writeln('\x1b[1;32mConnected. Buffering precision logs...\x1b[0m\r\n');
    };

    this.socket.onmessage = (event) => {
      // Precision rendering using xterm write
      this.term.write(event.data);
      // Auto-scroll ensures the latest logs are always visible
      this.term.scrollToBottom();
    };

    this.socket.onclose = () => {
      this.statusText.set('Stream Closed');
      this.statusColor.set('bg-rose-500');
      this.term.writeln('\r\n\x1b[1;31mStream closed. Reconnect for latest logs.\x1b[0m');
    };

    this.socket.onerror = () => {
      this.statusText.set('Error');
      this.statusColor.set('bg-rose-500');
    };
  }

  clearLogs(): void {
    this.term.clear();
  }
}
