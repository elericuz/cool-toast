// Fragmentos de código estáticos de la sección de instalación (fuera de .svelte para que el
// escáner de dependencias de Vite no confunda el `<script>` del ejemplo con código real)
export const installCode = 'npm i @elericuz/cool-toast';

export const layoutCode = `<script lang="ts">
  import '@elericuz/cool-toast/styles.css';
  import { Toaster } from '@elericuz/cool-toast';

  let { children } = $props();
</script>

<Toaster />
{@render children()}`;

export const usageCode = `import { toast } from '@elericuz/cool-toast';

toast.success('Saved', {
  description: 'Your changes are live.'
});`;

// --- Referencia de la API (sección "API") ---
// Derivada de src/lib/types.ts, src/lib/toast.ts, src/lib/animation-presets.ts, src/lib/styles.css y README.md.
// No documenta nada que la librería no exporte hoy.

export interface ApiEntry {
	/** Nombre, firma o variable; se muestra en monoespaciada. */
	name: string;
	/** Tipo TypeScript, si aplica. */
	type?: string;
	/** Valor por defecto, si aplica. */
	defaultValue?: string;
	description: string;
}

export interface ApiGroup {
	title: string;
	entries: ApiEntry[];
}

export interface ApiTab {
	id: string;
	label: string;
	intro: string;
	groups: ApiGroup[];
}

export const apiTabs: ApiTab[] = [
	{
		id: 'toaster',
		label: 'Toaster',
		intro: 'Props of the <Toaster> component. Render one in your root layout.',
		groups: [
			{
				title: 'Scope',
				entries: [
					{
						name: 'id',
						type: 'string',
						defaultValue: "'default'",
						description:
							'Names this Toaster; it shows only the toasts sent with the same toasterId.'
					},
					{
						name: 'inline',
						type: 'boolean',
						defaultValue: 'false',
						description:
							'Fills its nearest positioned ancestor instead of the viewport; position and offset apply inside it.'
					}
				]
			},
			{
				title: 'Placement',
				entries: [
					{
						name: 'position',
						type: 'Position',
						defaultValue: "'bottom-right'",
						description:
							'top-left, top-center, top-right, bottom-left, bottom-center or bottom-right.'
					},
					{
						name: 'theme',
						type: "'light' | 'dark' | 'system'",
						defaultValue: "'system'",
						description: 'system follows prefers-color-scheme and updates live.'
					},
					{
						name: 'gap',
						type: 'number',
						defaultValue: '14',
						description: 'Space between toasts, in px.'
					},
					{
						name: 'offset',
						type: 'string',
						defaultValue: "'24px'",
						description: 'Distance from the viewport edge, any CSS length.'
					},
					{
						name: 'dir',
						type: "'ltr' | 'rtl'",
						defaultValue: "'ltr'",
						description: 'Text direction; in RTL left and right positions mirror.'
					}
				]
			},
			{
				title: 'Queue and timing',
				entries: [
					{
						name: 'duration',
						type: 'number',
						defaultValue: '4000',
						description: 'Lifetime of compact toasts, in ms. Infinity disables auto close.'
					},
					{
						name: 'visibleToasts',
						type: 'number',
						defaultValue: '3',
						description: 'Maximum toasts on screen; the rest wait in a FIFO queue.'
					},
					{
						name: 'maxQueue',
						type: 'number',
						defaultValue: 'Infinity',
						description: 'Maximum queued toasts.'
					},
					{
						name: 'queueOverflow',
						type: "'drop-oldest' | 'drop-newest'",
						defaultValue: "'drop-oldest'",
						description: 'What to drop when the queue is full.'
					}
				]
			},
			{
				title: 'Interaction',
				entries: [
					{
						name: 'closeButton',
						type: "boolean | 'top-left' | 'top-right'",
						defaultValue: 'false',
						description:
							"Shows a close button; true means 'top-left'. Hidden while a promise loads."
					},
					{
						name: 'closeOnEscape',
						type: 'boolean',
						defaultValue: 'true',
						description: 'Escape dismisses the newest toast.'
					},
					{
						name: 'swipeToDismiss',
						type: 'boolean',
						defaultValue: 'true',
						description: 'A horizontal swipe of 100 px, mouse or touch, dismisses.'
					},
					{
						name: 'labels',
						type: '{ close?: string }',
						defaultValue: "{ close: 'Close notification' }",
						description: 'Accessible texts, for translation.'
					}
				]
			},
			{
				title: 'Motion and display',
				entries: [
					{
						name: 'preset',
						type: 'AnimationPresetName',
						defaultValue: 'none',
						description: 'smooth, subtle, snappy or bouncy (see animationPresets).'
					},
					{
						name: 'spring',
						type: 'boolean',
						defaultValue: 'true',
						description: 'false uses eased tweens instead of springs.'
					},
					{
						name: 'bounce',
						type: 'number',
						defaultValue: '0.4',
						description: 'Spring bounce.'
					},
					{
						name: 'showProgress',
						type: 'boolean',
						defaultValue: 'false',
						description: 'Progress bar on expanded toasts.'
					},
					{
						name: 'showTimestamp',
						type: 'boolean',
						defaultValue: 'true',
						description: 'Creation time on each toast.'
					}
				]
			}
		]
	},
	{
		id: 'toast',
		label: 'toast',
		intro: 'Every function returns the toast id, generated or the id you passed.',
		groups: [
			{
				title: 'Create',
				entries: [
					{
						name: 'toast(title: string, options?: ToastOptions): string | number',
						description:
							'A neutral toast. Passing the id of an existing toast replaces it in place.'
					},
					{
						name: 'toast.success(title: string, options?: ToastOptions): string | number',
						description: 'Success colour and icon.'
					},
					{
						name: 'toast.error(title: string, options?: ToastOptions): string | number',
						description: 'Error colour and icon, announced assertively.'
					},
					{
						name: 'toast.warning(title: string, options?: ToastOptions): string | number',
						description: 'Warning colour and icon, announced assertively.'
					},
					{
						name: 'toast.info(title: string, options?: ToastOptions): string | number',
						description: 'Info colour and icon.'
					}
				]
			},
			{
				title: 'Change and dismiss',
				entries: [
					{
						name: 'toast.promise<T>(promise: Promise<T>, data: PromiseData<T>): string',
						description:
							'Shows a spinner while pending, then settles into success or error in place.'
					},
					{
						name: 'toast.update(id: string | number, options: ToastUpdateOptions): void',
						description:
							'Changes title, description, type, action, icon or showTimestamp of a live or queued toast. icon: null removes the icon.'
					},
					{
						name: 'toast.dismiss(idOrFilter?: string | number | DismissFilter): void',
						description:
							'One toast by id, every toast of a type with { type }, or all toasts and the queue with no argument.'
					}
				]
			},
			{
				title: 'PromiseData<T>',
				entries: [
					{
						name: 'loading',
						type: 'string',
						description: 'Title while the promise is pending.'
					},
					{
						name: 'success',
						type: 'string | ((data: T) => string)',
						description: 'Title when the promise resolves.'
					},
					{
						name: 'error',
						type: 'string | ((error: unknown) => string)',
						description: 'Title when the promise rejects. The rejection does not propagate.'
					},
					{
						name: 'description',
						type: '{ loading?, success?, error? }',
						description:
							'Body per phase. Any function is a resolver, so wrap a Snippet: () => snippet.'
					},
					{
						name: 'action',
						type: '{ success?: ToastAction; error?: ToastAction }',
						description: 'Action button shown after the promise settles.'
					},
					{
						name: 'classes, fillColor, borderColor, borderWidth, timing, preset, spring, bounce, showProgress, showTimestamp, onDismiss, onAutoClose, toasterId',
						description: 'Same meaning as in ToastOptions.'
					}
				]
			}
		]
	},
	{
		id: 'options',
		label: 'Options',
		intro:
			'ToastOptions, the second argument of every toast call. An option that shares its name with a Toaster prop overrides it for that toast.',
		groups: [
			{
				title: 'Content',
				entries: [
					{
						name: 'description',
						type: 'string | Snippet',
						description: 'Body text or snippet; makes the toast expand.'
					},
					{
						name: 'action',
						type: '{ label: string; onClick: () => void; successLabel?: string }',
						description:
							'Action button; makes the toast expand. successLabel shows after a click, then the toast closes.'
					},
					{
						name: 'icon',
						type: 'Snippet',
						description: 'Replaces the built-in icon.'
					},
					{
						name: 'id',
						type: 'string | number',
						description: 'Custom id.'
					},
					{
						name: 'toasterId',
						type: 'string',
						description: "Id of the Toaster that shows the toast. Defaults to 'default'."
					}
				]
			},
			{
				title: 'Timing and callbacks',
				entries: [
					{
						name: 'duration',
						type: 'number',
						description: 'Compact toasts only, in ms. Infinity keeps it open.'
					},
					{
						name: 'timing',
						type: '{ displayDuration?: number }',
						description: 'Expanded toasts only: total time on screen, in ms. Default 4000.'
					},
					{
						name: 'onDismiss',
						type: '(id: string | number) => void',
						description: 'Called once whenever the toast is dismissed.'
					},
					{
						name: 'onAutoClose',
						type: '(id: string | number) => void',
						description: 'Called only when the timer closes the toast, before onDismiss.'
					}
				]
			},
			{
				title: 'Appearance',
				entries: [
					{
						name: 'classes',
						type: 'ToastClasses',
						description:
							'Extra classes for wrapper, content, header, title, icon, description, actionWrapper and actionButton.'
					},
					{
						name: 'fillColor',
						type: 'string',
						description: 'Background colour of the blob.'
					},
					{
						name: 'borderColor',
						type: 'string',
						description: 'Border colour.'
					},
					{
						name: 'borderWidth',
						type: 'number',
						description: 'Border width; 1.5 when borderColor is set.'
					},
					{
						name: 'showProgress, showTimestamp',
						type: 'boolean',
						description: 'Per-toast overrides of the Toaster props.'
					}
				]
			},
			{
				title: 'Motion',
				entries: [
					{
						name: 'preset',
						type: 'AnimationPresetName',
						description: 'Named spring settings; overridden by spring and bounce.'
					},
					{
						name: 'spring',
						type: 'boolean',
						description: 'false uses eased tweens instead of springs.'
					},
					{
						name: 'bounce',
						type: 'number',
						description: 'Spring bounce.'
					}
				]
			},
			{
				title: 'animationPresets',
				entries: [
					{
						name: 'smooth',
						type: '{ bounce: 0.1, spring: true }',
						description: 'Low bounce.'
					},
					{
						name: 'subtle',
						type: '{ bounce: 0.05, spring: true }',
						description: 'The lowest bounce.'
					},
					{
						name: 'snappy',
						type: '{ bounce: 0.4, spring: true }',
						description: 'Same bounce as the default.'
					},
					{
						name: 'bouncy',
						type: '{ bounce: 0.6, spring: true }',
						description: 'The highest bounce.'
					}
				]
			}
		]
	},
	{
		id: 'theming',
		label: 'Theming',
		intro:
			'CSS custom properties, set on [data-cool-toaster]. Dark values apply under [data-theme="dark"].',
		groups: [
			{
				title: 'Colours',
				entries: [
					{
						name: '--cool-toast-fill',
						description: 'Background of the blob.'
					},
					{
						name: '--cool-toast-border-color, --cool-toast-border-width',
						description: 'Optional outline of the blob.'
					},
					{
						name: '--cool-toast-{type}-color',
						description: 'Accent of each type: default, success, error, warning and info.'
					},
					{
						name: '--cool-toast-{type}-action-bg, -hover, -active',
						description: 'Action button background per type and state.'
					},
					{
						name: '--cool-toast-description-color, --cool-toast-timestamp-color, --cool-toast-close-color',
						description: 'Body text, timestamp and close button.'
					},
					{
						name: '--cool-toast-loading-color, --cool-toast-default-progress, --cool-toast-progress-track',
						description: 'Spinner, progress bar and its track.'
					}
				]
			},
			{
				title: 'Density',
				entries: [
					{
						name: '--cool-toast-pill-padding, --cool-toast-body-padding',
						description: 'Padding of the compact pill and of the expanded body.'
					},
					{
						name: '--cool-toast-font, --cool-toast-title-size, --cool-toast-description-size',
						description: 'Font family and text sizes.'
					},
					{
						name: '--cool-toast-gap, --cool-toast-offset',
						description: 'Set from the gap and offset props.'
					}
				]
			},
			{
				title: 'Radius',
				entries: [
					{
						name: '--cool-toast-radius-body',
						description: 'Rounds the box that keeps text inside the blob while it morphs.'
					}
				]
			},
			{
				title: 'Shadow',
				entries: [
					{
						name: '--cool-toast-shadow',
						description: 'A filter drop-shadow list drawn around the blob.'
					}
				]
			}
		]
	}
];
