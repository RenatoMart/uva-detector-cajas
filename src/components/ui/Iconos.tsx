import type { ReactNode } from 'react';

interface Props {
	className?: string;
}

function Svg({ className, children }: Props & { children: ReactNode }) {
	return (
		<svg
			aria-hidden='true'
			className={className ?? 'size-5'}
			fill='none'
			stroke='currentColor'
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={2}
			viewBox='0 0 24 24'
		>
			{children}
		</svg>
	);
}

export const IconoCheck = (p: Props) => (
	<Svg {...p}>
		<path d='M20 6 9 17l-5-5' />
	</Svg>
);

export const IconoX = (p: Props) => (
	<Svg {...p}>
		<path d='M18 6 6 18M6 6l12 12' />
	</Svg>
);

export const IconoAlerta = (p: Props) => (
	<Svg {...p}>
		<path d='m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3' />
		<path d='M12 9v4M12 17h.01' />
	</Svg>
);

export const IconoPlay = (p: Props) => (
	<Svg {...p}>
		<path d='m6 3 14 9-14 9z' />
	</Svg>
);

export const IconoStop = (p: Props) => (
	<Svg {...p}>
		<rect height='12' rx='1' width='12' x='6' y='6' />
	</Svg>
);

export const IconoCamara = (p: Props) => (
	<Svg {...p}>
		<path d='M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z' />
		<circle cx='12' cy='13' r='3' />
	</Svg>
);

export const IconoImagen = (p: Props) => (
	<Svg {...p}>
		<rect height='18' rx='2' width='18' x='3' y='3' />
		<circle cx='9' cy='9' r='2' />
		<path d='m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21' />
	</Svg>
);

export const IconoSpinner = (p: Props) => (
	<Svg className={`${p.className ?? 'size-5'} motion-safe:animate-spin`}>
		<path d='M21 12a9 9 0 1 1-6.2-8.6' />
	</Svg>
);

export const IconoInfo = (p: Props) => (
	<Svg {...p}>
		<circle cx='12' cy='12' r='10' />
		<path d='M12 16v-4M12 8h.01' />
	</Svg>
);
