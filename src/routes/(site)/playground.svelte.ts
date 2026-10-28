import { MediaQuery } from 'svelte/reactivity';
import {
	toast,
	type AnimationPresetName,
	type Position,
	type Theme,
	type ToasterProps,
	type ToastOptions,
	type ToastType
} from '#lib';

export type CloseButtonChoice = 'off' | 'top-left' | 'top-right';

export interface Choice<T extends string> {
	value: T;
	label: string;
}

export const typeChoices: Choice<ToastType>[] = [
	{ value: 'default', label: 'Default' },
	{ value: 'success', label: 'Success' },
	{ value: 'error', label: 'Error' },
	{ value: 'warning', label: 'Warning' },
	{ value: 'info', label: 'Info' }
];

export const positionChoices: Choice<Position>[] = [
	{ value: 'top-left', label: 'Top left' },
	{ value: 'top-center', label: 'Top center' },
	{ value: 'top-right', label: 'Top right' },
	{ value: 'bottom-left', label: 'Bottom left' },
	{ value: 'bottom-center', label: 'Bottom center' },
	{ value: 'bottom-right', label: 'Bottom right' }
];

export const presetChoices: Choice<AnimationPresetName>[] = [
	{ value: 'smooth', label: 'Smooth' },
	{ value: 'subtle', label: 'Subtle' },
	{ value: 'snappy', label: 'Snappy' },
	{ value: 'bouncy', label: 'Bouncy' }
];

export const themeChoices: Choice<Theme>[] = [
	{ value: 'system', label: 'System' },
	{ value: 'light', label: 'Light' },
	{ value: 'dark', label: 'Dark' }
];

export const closeButtonChoices: Choice<CloseButtonChoice>[] = [
	{ value: 'off', label: 'Off' },
	{ value: 'top-left', label: 'Top left' },
	{ value: 'top-right', label: 'Top right' }
];

// Textos de ejemplo por tipo de toast
const samples: Record<ToastType, { title: string; description: string }> = {
	default: {
		title: 'Draft saved',
		description: 'We keep a copy every few seconds while you type.'
	},
	success: { title: 'Payment received', description: 'A receipt is on its way to your inbox.' },
	error: { title: 'Could not publish', description: 'Check your connection and try again.' },
	warning: { title: 'Storage almost full', description: 'You have used 92% of your plan.' },
	info: {
		title: 'New version available',
		description: 'Reload the page to get the latest features.'
	}
};

const BURST_SIZE = 6;
const BURST_STEP_MS = 140;
const PROMISE_DELAY_MS = 2200;

// Escapa comillas simples para los snippets de código generados
const quote = (text: string) => `'${text.replace(/'/g, "\\'")}'`;

/** Estado del playground de la demo; alimenta al `<Toaster>` y genera los snippets. */
class Playground {
	type = $state<ToastType>('success');
	position = $state<Position>('bottom-right');
	preset = $state<AnimationPresetName>('snappy');
	theme = $state<Theme>('system');
	closeButton = $state<CloseButtonChoice>('off');
	withDescription = $state(true);
	withAction = $state(false);
	withSuccessLabel = $state(false);
	showProgress = $state(false);
	showTimestamp = $state(true);

	readonly reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)', false);

	readonly toasterProps: ToasterProps = $derived({
		position: this.position,
		preset: this.preset,
		theme: this.theme,
		showProgress: this.showProgress,
		showTimestamp: this.showTimestamp,
		closeButton: this.closeButton === 'off' ? false : this.closeButton
	});

	readonly toasterSnippet = $derived.by(() => {
		const props = [
			`position="${this.position}"`,
			`preset="${this.preset}"`,
			`theme="${this.theme}"`
		];
		if (this.showProgress) props.push('showProgress');
		if (!this.showTimestamp) props.push('showTimestamp={false}');
		if (this.closeButton !== 'off') props.push(`closeButton="${this.closeButton}"`);
		return `<Toaster ${props.join(' ')} />`;
	});

	readonly toastSnippet = $derived.by(() => {
		const { title, description } = samples[this.type];
		const call = this.type === 'default' ? 'toast' : `toast.${this.type}`;
		const lines: string[] = [];
		if (this.withDescription) lines.push(`  description: ${quote(description)}`);
		if (this.withAction) {
			const successLabel = this.withSuccessLabel ? `, successLabel: 'Done!'` : '';
			lines.push(`  action: { label: 'Undo', onClick: () => undo()${successLabel} }`);
		}
		if (lines.length === 0) return `${call}(${quote(title)});`;
		return `${call}(${quote(title)}, {\n${lines.join(',\n')}\n});`;
	});

	readonly promiseSnippet = `toast.promise(upload(file), {
  loading: 'Uploading report…',
  success: (data) => \`Uploaded \${data.name}\`,
  error: 'Upload failed',
  description: { success: () => 'Your file is ready to share.' }
});`;

	private options(): ToastOptions {
		const { description } = samples[this.type];
		return {
			description: this.withDescription ? description : undefined,
			action: this.withAction
				? {
						label: 'Undo',
						onClick: () => toast.info('Change undone'),
						successLabel: this.withSuccessLabel ? 'Done!' : undefined
					}
				: undefined
		};
	}

	/** Lanza un toast con la configuración actual. */
	fire(): void {
		const { title } = samples[this.type];
		if (this.type === 'default') toast(title, this.options());
		else toast[this.type](title, this.options());
	}

	/** Simula una subida que termina bien o mal tras unos segundos. */
	firePromise(outcome: 'resolve' | 'reject'): void {
		const upload = new Promise<{ name: string }>((resolve, reject) => {
			setTimeout(() => {
				if (outcome === 'resolve') resolve({ name: 'report.pdf' });
				else reject(new Error('Network unreachable'));
			}, PROMISE_DELAY_MS);
		});
		toast.promise(upload, {
			loading: 'Uploading report…',
			success: (data) => `Uploaded ${data.name}`,
			error: 'Upload failed',
			description: {
				success: () => 'Your file is ready to share.',
				error: 'Check your connection and try again.'
			}
		});
	}

	/** Lanza varios toasts seguidos para ver la cola en acción. */
	fireBurst(): void {
		const types: ToastType[] = ['default', 'success', 'info', 'warning', 'error', 'success'];
		for (let index = 0; index < BURST_SIZE; index += 1) {
			setTimeout(() => {
				const type = types[index % types.length];
				const title = `Queued toast ${index + 1} of ${BURST_SIZE}`;
				if (type === 'default') toast(title);
				else toast[type](title);
			}, index * BURST_STEP_MS);
		}
	}
}

export const playground = new Playground();
