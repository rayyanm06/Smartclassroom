/**
 * Imperative curtain transition that expands to cover the screen,
 * navigates to '/', and smoothly wipes away.
 * Appended directly to document.body so it survives React route unmount.
 */
export function runDashboardTransition(navigate: (path: string) => void): void {
  // Prevent duplicate execution
  if (document.getElementById('lp-transition-curtain')) return;

  const curtain = document.createElement('div');
  curtain.id = 'lp-transition-curtain';
  curtain.style.position = 'fixed';
  curtain.style.inset = '0';
  curtain.style.zIndex = '99999';
  curtain.style.backgroundColor = '#FFD83D';
  curtain.style.transform = 'translateY(100%)';
  curtain.style.transition = 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1)';
  curtain.style.display = 'flex';
  curtain.style.flexDirection = 'column';
  curtain.style.alignItems = 'center';
  curtain.style.justifyContent = 'center';
  curtain.style.borderTop = '6px solid #111111';
  curtain.style.boxShadow = '0 -10px 0 #111111';

  curtain.innerHTML = `
    <div style="
      background: #FFFFFF;
      border: 4px solid #111111;
      box-shadow: 8px 8px 0px #111111;
      padding: 24px 36px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      text-align: center;
    ">
      <div style="font-size: 20px; font-weight: 900; letter-spacing: 0.1em; color: #111111;">
        INITIALIZING DASHBOARD
      </div>
      <div style="font-size: 11px; font-weight: 700; color: #666666; letter-spacing: 0.15em;">
        CONNECTING TO LIVE TELEMETRY MATRIX
      </div>
      <div style="
        width: 180px;
        height: 6px;
        background: #EEEEEE;
        border: 2px solid #111111;
        overflow: hidden;
        margin-top: 8px;
        position: relative;
      ">
        <div style="
          width: 60%;
          height: 100%;
          background: #111111;
          animation: lp-shimmer 0.8s infinite linear;
        "></div>
      </div>
    </div>
  `;

  document.body.appendChild(curtain);

  // Trigger slide up into view
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      curtain.style.transform = 'translateY(0%)';
    });
  });

  // Navigate after curtain covers screen
  setTimeout(() => {
    navigate('/');

    // Slide away after dashboard mounts
    setTimeout(() => {
      curtain.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        curtain.remove();
      }, 500);
    }, 400);
  }, 450);
}
