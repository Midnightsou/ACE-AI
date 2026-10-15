// GrimMascot.jsx — Grim, the ACE brand mascot (a character, not an assistant).
// Pure SVG, no dependencies. Scales from 64px to 320px.
//
//   <GrimMascot mood="welcome" size={160} />
//   moods: welcome | celebrate | safe | think | happy | oops
//   animate={false} turns motion off (static image).

import './grim.css'

const MOTION = { welcome: 'idle', happy: 'idle', safe: 'idle', celebrate: 'jump', think: 'pulse', oops: 'shake' }

const C = {
  blue: '#0066FF',
  cyan: '#06B6D4',
  gold: '#FBBF24',
  cream: '#FFF4D6',
  white: '#F8FAFC',
  skin: '#8B5A3C',
  skinShade: '#74472C',
  navy: '#0A2A66',
  ink: '#07163A',
  blush: '#E8836B',
};

const OUT = { stroke: C.ink, strokeWidth: 2.5, strokeLinejoin: 'round' };

function Cowrie({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse rx={5.5} ry={7.5} fill={C.cream} stroke={C.ink} strokeWidth={1.8} />
      <path d="M0 -5 V5" stroke={C.ink} strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

function Cap() {
  return (
    <g>
      <path d="M146 72 Q172 84 164 120 Q148 108 142 88Z" fill={C.cyan} {...OUT} />
      <path d="M52 90 C52 50 78 34 100 34 L100 90 Z" fill={C.blue} {...OUT} />
      <path d="M148 90 C148 50 122 34 100 34 L100 90 Z" fill={C.cyan} {...OUT} />
      <path d="M50 88 Q100 100 150 88" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      <path d="M50 88 Q100 100 150 88" fill="none" stroke={C.gold} strokeWidth={5} strokeLinecap="round" />
      <g stroke={C.gold} strokeWidth={5} strokeLinecap="round">
        <path d="M91 50 L109 68" stroke={C.ink} strokeWidth={8.5} />
        <path d="M109 50 L91 68" stroke={C.ink} strokeWidth={8.5} />
        <path d="M91 50 L109 68" />
        <path d="M109 50 L91 68" />
      </g>
    </g>
  );
}

function Eyes({ mood }) {
  const eye = (cx, dx = 0, dy = 0) => (
    <g key={cx}>
      <ellipse cx={cx} cy={106} rx={6} ry={7.5} fill={C.ink} />
      <circle cx={cx + 2 + dx} cy={103 + dy} r={2.3} fill="#fff" />
    </g>
  );
  const happyArc = (cx) => (
    <path key={cx} d={`M${cx - 7} 108 Q${cx} 98 ${cx + 7} 108`} fill="none" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" />
  );
  const brows = (
    <g fill="none" stroke={C.skinShade} strokeWidth={3} strokeLinecap="round">
      <path d="M76 92 Q84 88 92 92" />
      <path d="M108 92 Q116 88 124 92" />
    </g>
  );
  if (mood === 'celebrate') return <>{happyArc(84)}{happyArc(116)}</>;
  if (mood === 'safe') return (<>{brows}{eye(84)}<path d="M109 107 Q116 100 123 107" fill="none" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" /></>);
  if (mood === 'think') return <>{brows}{eye(84, 2, -3)}{eye(116, 2, -3)}</>;
  if (mood === 'oops') return (<><path d="M76 90 Q84 94 92 89 M108 89 Q116 94 124 90" fill="none" stroke={C.skinShade} strokeWidth={3} strokeLinecap="round" />{eye(84)}{eye(116)}</>);
  return <>{brows}{eye(84)}{eye(116)}</>;
}

function Mouth({ mood }) {
  const line = { fill: 'none', stroke: C.ink, strokeWidth: 3.5, strokeLinecap: 'round' };
  if (mood === 'celebrate' || mood === 'welcome') return <path d="M90 120 Q100 134 110 120Z" fill={C.ink} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />;
  if (mood === 'think') return <path d="M93 122 Q102 129 110 120" {...line} />;
  if (mood === 'oops') return <path d="M91 126 Q95 121 100 126 Q105 131 109 126" {...line} />;
  return <path d="M90 121 Q100 130 110 121" {...line} />;
}

function Arms({ mood }) {
  const arm = (d, hx, hy, key) => (
    <g key={key}>
      <path d={d} fill="none" stroke={C.ink} strokeWidth={14} strokeLinecap="round" />
      <path d={d} fill="none" stroke={C.white} strokeWidth={9} strokeLinecap="round" />
      <circle cx={hx} cy={hy} r={6.5} fill={C.skin} {...OUT} />
    </g>
  );
  const L = 'M72 156 Q56 166 55 184';
  const R = 'M128 156 Q144 166 145 184';
  if (mood === 'welcome') return (<>{arm(L, 55, 184, 'l')}{arm('M128 156 Q152 150 156 126', 156, 124, 'r')}<path d="M165 112 Q174 122 168 134" fill="none" stroke={C.cyan} strokeWidth={3} strokeLinecap="round" /></>);
  if (mood === 'celebrate') return (<>{arm('M72 156 Q48 146 44 120', 44, 118, 'l')}{arm('M128 156 Q152 146 156 120', 156, 118, 'r')}</>);
  if (mood === 'safe') return (<>{arm('M72 156 Q54 172 68 192', 69, 193, 'l')}{arm(R, 145, 184, 'r')}</>);
  if (mood === 'think') return (<>{arm(L, 55, 184, 'l')}{arm('M128 158 Q150 148 124 134', 123, 133, 'r')}</>);
  return <>{arm(L, 55, 184, 'l')}{arm(R, 145, 184, 'r')}</>;
}

function Extras({ mood }) {
  if (mood === 'celebrate') return (
    <g fill={C.gold} stroke={C.ink} strokeWidth={1.5}>
      <path d="M22 44 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3Z" />
      <path d="M178 38 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5Z" />
      <path d="M30 96 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z" />
    </g>
  );
  if (mood === 'think') return (
    <g fill={C.cyan}>
      <circle cx={160} cy={56} r={4} />
      <circle cx={172} cy={42} r={5.5} />
      <circle cx={188} cy={26} r={8} />
    </g>
  );
  if (mood === 'oops') return <path d="M150 74 q-6 10 0 15 q6 -5 0 -15Z" fill={C.cyan} stroke={C.ink} strokeWidth={1.5} />;
  return null;
}

export default function GrimMascot({ mood = 'happy', size = 160, className = '', title = 'Grim, the ACE mascot', animate = true }) {
  const motion = animate ? `grim-body grim-${MOTION[mood] || 'idle'}` : '';
  return (
    <svg viewBox="0 0 200 240" width={size} height={size * 1.2} className={className} role="img" aria-label={title}>
      <ellipse cx={100} cy={232} rx={38} ry={5} fill={C.ink} opacity={0.12} />
      <g className={motion}>
        <rect x={83} y={196} width={12} height={22} rx={5} fill={C.navy} {...OUT} />
        <rect x={105} y={196} width={12} height={22} rx={5} fill={C.navy} {...OUT} />
        <ellipse cx={87} cy={222} rx={12} ry={6} fill={C.gold} {...OUT} />
        <ellipse cx={113} cy={222} rx={12} ry={6} fill={C.gold} {...OUT} />
        <rect x={68} y={142} width={64} height={60} rx={24} fill={C.white} {...OUT} />
        <path d="M84 146 Q100 158 116 146" fill="none" stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
        <Cowrie x={100} y={164} />
        {/* waist pouch */}
        <path d="M58 184 Q74 177 90 184 L88 206 Q74 214 60 206Z" fill={C.gold} {...OUT} />
        <Cowrie x={74} y={196} s={0.75} />
        <Arms mood={mood} />
        <rect x={90} y={128} width={20} height={20} rx={8} fill={C.skinShade} {...OUT} />
        <circle cx={55} cy={108} r={9} fill={C.skin} {...OUT} />
        <circle cx={145} cy={108} r={9} fill={C.skin} {...OUT} />
        <circle cx={100} cy={104} r={46} fill={C.skin} {...OUT} />
        <circle cx={74} cy={120} r={5.5} fill={C.blush} opacity={0.3} />
        <circle cx={126} cy={120} r={5.5} fill={C.blush} opacity={0.3} />
        <g className={mood === 'celebrate' ? '' : 'grim-eyes'}>
          <Eyes mood={mood} />
        </g>
        <path d="M97 113 Q100 117 103 113" fill="none" stroke={C.skinShade} strokeWidth={2.5} strokeLinecap="round" />
        <Mouth mood={mood} />
        <Cap />
        <Extras mood={mood} />
      </g>
    </svg>
  );
}

