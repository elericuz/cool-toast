import { MediaQuery } from 'svelte/reactivity';
import {
	toast,
	type AnimationPresetName,
	type Position,
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

export const closeButtonChoices: Choice<CloseButtonChoice>[] = [
	{ value: 'off', label: 'Off' },
	{ value: 'top-left', label: 'Top left' },
	{ value: 'top-right', label: 'Top right' }
];

// Textos de ejemplo por tipo de toast (compartidos con el bucle del hero)
export const samples: Record<ToastType, { title: string; description: string }> = {
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

export const INSTALL_COMMAND = 'npm i @elericuz/cool-toast';

const BURST_SIZE = 6;
const BURST_STEP_MS = 140;
const PROMISE_DELAY_MS = 2200;

// Escapa comillas simples para los snippets de código generados
const quote = (text: string) => `'${text.replace(/'/g, "\\'")}'`;

/** Copia texto al portapapeles y avisa con un toast; si falla, explica qué hacer sin detalles técnicos. */
export async function copyText(text: string, successTitle: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(text);
		toast.success(successTitle);
	} catch {
		toast.error('Could not copy', { description: 'Select the text and copy it by hand.' });
	}
}

/** Estado del playground de la demo; alimenta al `<Toaster>` y genera los snippets. */
class Playground {
	type = $state<ToastType>('success');
	position = $state<Position>('bottom-right');
	preset = $state<AnimationPresetName>('snappy');
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
		// La demo es solo de modo claro
		theme: 'light',
		showProgress: this.showProgress,
		showTimestamp: this.showTimestamp,
		closeButton: this.closeButton === 'off' ? false : this.closeButton
	});

	readonly toasterSnippet = $derived.by(() => {
		const props = [`position="${this.position}"`, `preset="${this.preset}"`, 'theme="light"'];
		if (this.showProgress) props.push('showProgress');
		if (!this.showTimestamp) props.push('showTimestamp={false}');
		if (this.closeButton !== 'off') props.push(`closeButton="${this.closeButton}"`);
		// Una prop por línea para que el snippet nunca se corte horizontalmente
		return `<Toaster\n${props.map((prop) => `  ${prop}`).join('\n')}\n/>`;
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
  description: {
    success: () => 'Your file is ready to share.'
  }
});`;

	private options(type: ToastType): ToastOptions {
		const { description } = samples[type];
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

	/** Lanza un toast del tipo indicado (o del elegido en el playground) con la configuración actual. */
	fire(type: ToastType = this.type): void {
		const { title } = samples[type];
		const options = this.options(type);
		if (type === 'default') toast(title, options);
		else toast[type](title, options);
	}

	/** Toast de presentación del hero: cuerpo, acción con confirmación y barra de progreso. */
	showcase(): void {
		toast.success('Payment received', {
			description: 'A receipt is on its way.',
			action: { label: 'Undo', onClick: () => {}, successLabel: 'Restored' },
			showProgress: true
		});
	}

	/** Copia el comando de instalación y confirma con un toast. */
	copyInstall(): Promise<void> {
		return copyText(INSTALL_COMMAND, 'Install command copied');
	}

	/** Simula una subida que termina bien o mal tras unos segundos. */
	promise(outcome: 'resolve' | 'reject'): void {
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
	burst(): void {
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
